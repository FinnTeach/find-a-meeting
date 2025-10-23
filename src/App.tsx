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
    const coordinates = meetings
      .filter(meeting => meeting.coordinates && meeting.type?.toLowerCase() !== 'virtual')
      .map(meeting => meeting.coordinates!);
    
    if (coordinates.length === 0) {
      // Default to Portland, ME if no coordinates
      map.setView([43.6591, -70.2568], 10);
      return;
    }
    
    if (coordinates.length === 1) {
      // If only one marker, center on it with a reasonable zoom
      const [lat, lng] = coordinates[0];
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
    
    // Add some padding
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;
    
    const bounds = new LatLngBounds(
      [minLat - latPadding, minLng - lngPadding],
      [maxLat + latPadding, maxLng + lngPadding]
    );
    
    map.fitBounds(bounds);
  }, [map, meetings]);

  return null;
}

// Add geocoding function
async function geocodeAddress(address: string): Promise<[number, number] | null> {
  if (!address) return null;
  
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
      return null;
    }
    
    const data = await response.json();
    
    if (data && data[0]) {
      console.log(`Geocoded "${address}" to: ${data[0].lat}, ${data[0].lon}`);
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    
    console.warn(`No geocoding results for: "${address}"`);
    return null;
  } catch (error) {
    console.error(`Geocoding error for "${address}":`, error);
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
    // Load and parse CSV file (ME dataset)
    fetch('/ME_District_S2_AlAnon_Meetings.csv')
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
              
              // Add coordinates to meetings with addresses (with delay to avoid rate limiting)
              const meetingsWithCoordinates = [];
              for (let i = 0; i < parsedMeetings.length; i++) {
                const meeting = parsedMeetings[i];
                if (meeting.address) {
                  const coordinates = await geocodeAddress(meeting.address);
                  meetingsWithCoordinates.push({ ...meeting, coordinates });
                  // Add delay between requests to avoid rate limiting
                  if (i < parsedMeetings.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                } else {
                  meetingsWithCoordinates.push(meeting);
                }
              }
              
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
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '600px' }}>
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
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>{meeting.address}</Typography>
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
          <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.primary', fontWeight: 'medium' }}>
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