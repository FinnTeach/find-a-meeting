import { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Alert, Box, IconButton } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngBounds, DivIcon } from 'leaflet';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
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

// Component for scrollable meeting popup
function MeetingPopup({ meetings }: { meetings: Meeting[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentMeeting = meetings[currentIndex];
  const isMultiple = meetings.length > 1;

  const nextMeeting = () => {
    setCurrentIndex((prev) => (prev + 1) % meetings.length);
  };

  const prevMeeting = () => {
    setCurrentIndex((prev) => (prev - 1 + meetings.length) % meetings.length);
  };

  return (
    <Box sx={{ minWidth: 250, maxWidth: 300 }}>
      {isMultiple && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 1,
          p: 1,
          backgroundColor: '#f5f5f5',
          borderRadius: 1
        }}>
          <IconButton 
            size="small" 
            onClick={prevMeeting}
            disabled={meetings.length <= 1}
          >
            <ChevronLeft />
          </IconButton>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {currentIndex + 1} of {meetings.length} meetings
          </Typography>
          <IconButton 
            size="small" 
            onClick={nextMeeting}
            disabled={meetings.length <= 1}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      )}
      
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        {currentMeeting.name}
      </Typography>
      
      <Typography variant="body2" sx={{ color: 'text.primary', mb: 0.5, fontWeight: 'medium' }}>
        {currentMeeting.day ? currentMeeting.day.charAt(0).toUpperCase() + currentMeeting.day.slice(1) : 'Unknown day'} at {currentMeeting.timeDisplay}
      </Typography>
      
      <Typography variant="body2" sx={{ color: 'text.primary', mb: 0.5 }}>
        {cleanAddressDisplay(currentMeeting.address)}
      </Typography>
      
      {currentMeeting.zoomId && (
        <Box sx={{ mb: 0.5 }}>
          {createZoomLink(currentMeeting) ? (
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              <a 
                href={createZoomLink(currentMeeting)!} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#1976d2', 
                  textDecoration: 'none',
                  fontWeight: 'medium'
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                🎥 Join Zoom Meeting
              </a>
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              Zoom: {currentMeeting.zoomId}
            </Typography>
          )}
        </Box>
      )}
      
      {currentMeeting.notes && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          {currentMeeting.notes}
        </Typography>
      )}
      
      {isMultiple && meetings.length > 1 && (
        <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Use arrows above to view other meetings at this location
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// Geocoding cache to avoid re-geocoding same addresses
const geocodingCache = new Map<string, [number, number] | null>();

// Pre-populate cache with known Maine addresses for faster loading
const preloadedCoordinates = {
  "515 Woodford Street, Portland, ME 04103": [43.6591, -70.2568],
  "279 Congress St, Portland, ME 04101": [43.6578, -70.2583],
  "25 Church Avenue, Peaks Island, ME 04108": [43.6567, -70.2000],
  "43 Foreside Rd, Falmouth, ME 04105": [43.7297, -70.2400],
  "22 Church Hill Road, Buxton, ME 04093": [43.6378, -70.5189],
  "656 US Route 1, Scarborough, ME 04074": [43.5781, -70.3222],
  "102 Bishop Street, Portland, ME 04103": [43.6589, -70.2578],
  "40 Main St, Freeport, ME 04032": [43.8570, -70.1031],
  "15 Casco Street, Portland, ME 04101": [43.6572, -70.2589],
  "24 North Raymond Road, Gray, ME 04039": [43.8856, -70.3317],
  "301 Cottage Road, South Portland, ME 04106": [43.6411, -70.2406],
  "1311 Roosevelt Trail, Raymond, ME 04071": [43.9011, -70.4700]
};

// Initialize cache with preloaded coordinates
Object.entries(preloadedCoordinates).forEach(([address, coords]) => {
  geocodingCache.set(address, coords as [number, number]);
});

// Function to create custom marker icon with number
function createNumberedMarkerIcon(count: number, isMultiple: boolean) {
  const size = isMultiple ? 40 : 30;
  const color = isMultiple ? '#ff6b35' : '#4caf50';
  const textColor = '#ffffff';
  
  return new DivIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${isMultiple ? '14px' : '12px'};
        color: ${textColor};
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${count}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

// Function to group meetings by coordinates
function groupMeetingsByLocation(meetings: Meeting[]): Array<{ coordinates: [number, number], meetings: Meeting[] }> {
  const locationMap = new Map<string, Meeting[]>();
  
  meetings.forEach(meeting => {
    if (meeting.coordinates && meeting.type?.toLowerCase() !== 'virtual') {
      const key = `${meeting.coordinates[0]},${meeting.coordinates[1]}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, []);
      }
      locationMap.get(key)!.push(meeting);
    }
  });
  
  return Array.from(locationMap.entries()).map(([key, meetings]) => {
    const [lat, lng] = key.split(',').map(Number);
    return {
      coordinates: [lat, lng] as [number, number],
      meetings
    };
  });
}

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

// Function to create Zoom link from meeting data
function createZoomLink(meeting: Meeting): string | null {
  if (!meeting.zoomId) return null;
  
  // Extract meeting ID from zoomId (remove any extra text)
  const meetingIdMatch = meeting.zoomId.match(/(\d{9,11})/);
  if (!meetingIdMatch) return null;
  
  const meetingId = meetingIdMatch[1];
  
  // Look for password in notes or zoomId
  let password = '';
  const passwordMatch = (meeting.notes + ' ' + meeting.zoomId).match(/[Pp]asscode?:\s*(\d+)/i);
  if (passwordMatch) {
    password = passwordMatch[1];
  }
  
  // Create Zoom link
  if (password) {
    return `https://zoom.us/j/${meetingId}?pwd=${password}`;
  } else {
    return `https://zoom.us/j/${meetingId}`;
  }
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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load and parse CSV file
    const csvPath = (import.meta as any).env?.VITE_MEETINGS_CSV || '/ME_District_S2_AlAnon_Meetings.csv';
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
              
              // Add coordinates to meetings with addresses (aggressively optimized)
              const meetingsWithCoordinates = [];
              const addressesToGeocode = parsedMeetings
                .filter(meeting => meeting.address && !geocodingCache.has(meeting.address))
                .map(meeting => meeting.address);
              
              console.log(`Geocoding ${addressesToGeocode.length} new addresses...`);
              
              // Process ALL addresses concurrently - no delays, no batching
              if (addressesToGeocode.length > 0) {
                await Promise.all(addressesToGeocode.map(address => geocodeAddress(address)));
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
              setIsLoading(false);
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
      
      {isLoading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Loading meetings and locations... This should only take a few seconds.
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
              {groupMeetingsByLocation(filteredMeetings).map((location, index) => {
                const isMultiple = location.meetings.length > 1;
                const markerIcon = createNumberedMarkerIcon(location.meetings.length, isMultiple);
                
                return (
                  <Marker 
                    key={index} 
                    position={location.coordinates}
                    icon={markerIcon}
                  >
                    <Popup>
                      <MeetingPopup meetings={location.meetings} />
                    </Popup>
                  </Marker>
                );
              })}
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