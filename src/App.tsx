import { useState, useEffect, useMemo } from 'react';
import { Container, Grid, Paper, Typography, Alert } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Papa from 'papaparse';
import { Meeting, TimeOfDay, MeetingType } from './types/Meeting';
import FilterControls from './components/FilterControls';
import MeetingList from './components/MeetingList';

// Component to fit map bounds to markers
function FitBounds({ meetings }: { meetings: Meeting[] }) {
  const map = useMap();
  
  useEffect(() => {
    console.log('FitBounds: meetings count:', meetings.length);
    
    const coordinates = meetings
      .filter(meeting => meeting.coordinates && meeting.type?.toLowerCase() !== 'virtual')
      .map(meeting => meeting.coordinates!);
    
    console.log('FitBounds: coordinates count:', coordinates.length);
    
    // Add a small delay to ensure markers are rendered before fitting bounds
    const timeoutId = setTimeout(() => {
      if (coordinates.length === 0) {
        // Default to Portland, ME if no coordinates
        console.log('FitBounds: No coordinates, setting default view');
        map.setView([43.6591, -70.2568], 10);
        return;
      }
      
      if (coordinates.length === 1) {
        // If only one marker, center on it with a reasonable zoom
        const [lat, lng] = coordinates[0];
        console.log('FitBounds: Single coordinate, centering on:', lat, lng);
        map.setView([lat, lng], 12);
        return;
      }
      
      // Calculate bounds for multiple markers
      const lats = coordinates.map(coord => coord[0]);
      const lngs = coordinates.map(coord => coord[1]);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      console.log('FitBounds: Bounds calculated:', { minLat, maxLat, minLng, maxLng });
      
      // Add some padding
      const latPadding = (maxLat - minLat) * 0.1;
      const lngPadding = (maxLng - minLng) * 0.1;
      
      const bounds = new LatLngBounds(
        [minLat - latPadding, minLng - lngPadding],
        [maxLat + latPadding, maxLng + lngPadding]
      );
      
      map.fitBounds(bounds);
    }, 100); // 100ms delay
    
    return () => clearTimeout(timeoutId);
  }, [map, meetings]);

  return null;
}

// Geocoding cache to avoid re-geocoding same addresses
const geocodingCache = new Map<string, [number, number] | null>();

// Function to clean up address display (remove state and zip)
function cleanAddressDisplay(address: string): string {
  if (!address) return '';
  
  // Remove state and zip code patterns like ", ME 04032" or ", Maine 04032"
  return address
    .replace(/,\s*ME\s+\d{5}(-\d{4})?/gi, '') // Remove ", ME 04032" or ", ME 04032-1234"
    .replace(/,\s*Maine\s+\d{5}(-\d{4})?/gi, '') // Remove ", Maine 04032"
    .replace(/,\s*ME$/gi, '') // Remove trailing ", ME"
    .replace(/,\s*Maine$/gi, '') // Remove trailing ", Maine"
    .trim();
}

// Add geocoding function with caching
async function geocodeAddress(address: string): Promise<[number, number] | null> {
  if (!address) return null;
  
  // Check cache first
  if (geocodingCache.has(address)) {
    console.log(`Using cached coordinates for: "${address}"`);
    return geocodingCache.get(address)!;
  }
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'MeetingFinder/1.0 (https://github.com/FinnTeach/find-a-meeting)'
        }
      }
    );
    
    if (!response.ok) {
      console.error(`Geocoding failed for "${address}": ${response.status} ${response.statusText}`);
      geocodingCache.set(address, null);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data[0]) {
      const coordinates: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      console.log(`Geocoded "${address}" to: ${coordinates[0]}, ${coordinates[1]}`);
      geocodingCache.set(address, coordinates);
      return coordinates;
    }
    
    console.warn(`No geocoding results for: "${address}"`);
    geocodingCache.set(address, null);
    return null;
  } catch (error) {
    console.error(`Geocoding error for "${address}":`, error);
    geocodingCache.set(address, null);
    return null;
  }
}

// Validate meeting data
function validateMeeting(meeting: any): Meeting | null {
  if (!meeting || !meeting.name || meeting.name.trim() === '') return null;
  
  return {
    name: meeting.name.trim(),
    description: meeting.description || '',
    day: meeting.day || '',
    time: (meeting.time as TimeOfDay) || 'morning',
    timeDisplay: meeting.timeDisplay || '',
    type: (meeting.type as MeetingType) || 'in-Person',
    address: meeting.address || '',
    Contact: meeting.Contact || '',
    zoomId: meeting.Zoomid || meeting.zoomId || '',
    notes: meeting.Notes || meeting.notes || '',
    format: meeting.format || '',
    coordinates: meeting.coordinates || null
  };
}

function App() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<TimeOfDay | ''>('');
  const [selectedType, setSelectedType] = useState<MeetingType | ''>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load and parse CSV file
    const csvPath = import.meta.env.VITE_MEETINGS_CSV || '/ME_District_S2_AlAnon_Meetings.csv';
    fetch(csvPath)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load meetings data');
        }
        return response.text();
      })
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          complete: async (results) => {
            try {
              const parsedMeetings = results.data
                .map(validateMeeting)
                .filter((meeting): meeting is Meeting => meeting !== null);
              
              // Add coordinates to meetings with addresses (optimized with batching)
              const meetingsWithCoordinates = [];
              const addressesToGeocode = parsedMeetings
                .filter(meeting => meeting.address && !geocodingCache.has(meeting.address))
                .map(meeting => meeting.address);
              
              console.log(`Geocoding ${addressesToGeocode.length} new addresses...`);
              
              // Process in batches of 3 with 200ms delay between batches
              for (let i = 0; i < addressesToGeocode.length; i += 3) {
                const batch = addressesToGeocode.slice(i, i + 3);
                await Promise.all(batch.map(address => geocodeAddress(address)));
                
                // Small delay between batches to respect rate limits
                if (i + 3 < addressesToGeocode.length) {
                  await new Promise(resolve => setTimeout(resolve, 200));
                }
              }
              
              // Now assign coordinates to all meetings
              for (const meeting of parsedMeetings) {
                if (meeting.address) {
                  const coordinates = geocodingCache.get(meeting.address) || null;
                  meetingsWithCoordinates.push({ ...meeting, coordinates });
                } else {
                  meetingsWithCoordinates.push(meeting);
                }
              }
              
              console.log('Total meetings loaded:', meetingsWithCoordinates.length);
              console.log('Meetings with coordinates:', meetingsWithCoordinates.filter(m => m.coordinates).length);
              setMeetings(meetingsWithCoordinates);
              setFilteredMeetings(meetingsWithCoordinates);
            } catch (err) {
              setError('Error processing meetings data');
              console.error('Error processing meetings:', err);
            }
          },
          error: (error: Error) => {
            setError('Error parsing CSV file');
            console.error('CSV parsing error:', error);
          }
        });
      })
      .catch(err => {
        setError('Failed to load meetings data');
        console.error('Fetch error:', err);
      });
  }, []);

  useEffect(() => {
    // Filter meetings based on selected criteria
    let filtered = [...meetings];
    
    if (selectedDay) {
      filtered = filtered.filter(meeting => {
        const meetingDay = meeting.day?.toLowerCase() || '';
        return meetingDay === selectedDay.toLowerCase();
      });
    }
    
    if (selectedTime) {
      filtered = filtered.filter(meeting => {
        const meetingTime = meeting.time || '';
        return meetingTime === selectedTime;
      });
    }
    
    if (selectedType) {
      filtered = filtered.filter(meeting => {
        const meetingType = meeting.type || '';
        return meetingType === selectedType;
      });
    }
    
    if (selectedFormat) {
      filtered = filtered.filter(meeting => {
        const meetingFormat = (meeting.format || '').toLowerCase();
        return meetingFormat === selectedFormat.toLowerCase();
      });
    }
    
    // Remove any meetings with empty or undefined names
    filtered = filtered.filter(meeting => meeting.name && meeting.name.trim() !== '');
    
    setFilteredMeetings(filtered);
  }, [selectedDay, selectedTime, selectedType, selectedFormat, meetings]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ color: '#0d2357' }}>
        Find a Meeting
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom align="center" sx={{ mb: 4, color: '#0d2357' }}>
        Select filters to find your perfect meeting.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <FilterControls
          selectedDay={selectedDay}
          selectedTime={selectedTime}
          selectedType={selectedType}
          selectedFormat={selectedFormat}
          onDayChange={setSelectedDay}
          onTimeChange={setSelectedTime}
          onTypeChange={setSelectedType}
          onFormatChange={setSelectedFormat}
          color="#0d2357"
        />
      </Paper>
      
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: { xs: '400px', md: '600px' } }}>
            <MapContainer
              center={[43.6591, -70.2568]} // Default center (will be overridden by FitBounds)
              zoom={10} // Default zoom (will be overridden by FitBounds)
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              <FitBounds meetings={filteredMeetings} />
              {filteredMeetings.map((meeting, index) => (
                meeting.coordinates && (meeting.type?.toLowerCase() !== 'virtual') && (
                  <Marker key={index} position={meeting.coordinates}>
                    <Popup>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{meeting.name}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>{meeting.timeDisplay}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>{cleanAddressDisplay(meeting.address)}</Typography>
                      {meeting.zoomId && (
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>Zoom: {meeting.zoomId}</Typography>
                      )}
                      {meeting.notes && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{meeting.notes}</Typography>
                      )}
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: { xs: '400px', md: '600px' }, overflow: 'auto' }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              color: 'text.primary', 
              fontWeight: 'medium',
              fontSize: { xs: '1.1rem', md: '1.25rem' }
            }}>
              Found {filteredMeetings.length} {filteredMeetings.length === 1 ? 'meeting' : 'meetings'}
            </Typography>
            <MeetingList meetings={filteredMeetings} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default App; 