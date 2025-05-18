import { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Alert } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Papa from 'papaparse';
import { Meeting, TimeOfDay, MeetingType } from './types/Meeting';
import FilterControls from './components/FilterControls';
import MeetingList from './components/MeetingList';

// Add geocoding function
async function geocodeAddress(address: string): Promise<[number, number] | null> {
  if (!address) return null;
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );
    const data = await response.json();
    
    if (data && data[0]) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
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
    coordinates: meeting.coordinates || null
  };
}

function App() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<TimeOfDay | ''>('');
  const [selectedType, setSelectedType] = useState<MeetingType | ''>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load and parse CSV file
    fetch('/NH_District_12_AlAnon_Meetings.csv')
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
              
              // Add coordinates to meetings with addresses
              const meetingsWithCoordinates = await Promise.all(
                parsedMeetings.map(async (meeting) => {
                  if (meeting.address) {
                    const coordinates = await geocodeAddress(meeting.address);
                    return { ...meeting, coordinates };
                  }
                  return meeting;
                })
              );
              
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
    
    // Remove any meetings with empty or undefined names
    filtered = filtered.filter(meeting => meeting.name && meeting.name.trim() !== '');
    
    setFilteredMeetings(filtered);
  }, [selectedDay, selectedTime, selectedType, meetings]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ color: '#0d2357' }}>
        Meeting Finder
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom align="center" sx={{ mb: 4, color: '#0d2357' }}>
        Find the right meeting for your recovery
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
          onDayChange={setSelectedDay}
          onTimeChange={setSelectedTime}
          onTypeChange={setSelectedType}
          color="#0d2357"
        />
      </Paper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '600px' }}>
            <MapContainer
              center={[43.0718, -70.7626]} // Portsmouth, NH coordinates
              zoom={10}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              {filteredMeetings.map((meeting, index) => (
                meeting.coordinates && (
                  <Marker key={index} position={meeting.coordinates}>
                    <Popup>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{meeting.name}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>{meeting.timeDisplay}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>{meeting.address}</Typography>
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