import { List, ListItem, ListItemText, Typography, Box, Chip } from '@mui/material';
import { Meeting } from '../types/Meeting';

interface MeetingListProps {
  meetings: Meeting[];
}

const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'in-person':
      return '#4caf50';
    case 'virtual':
      return '#2196f3';
    case 'hybrid':
      return '#ff9800';
    default:
      return '#757575';
  }
};

const getTimeColor = (time: string) => {
  switch (time.toLowerCase()) {
    case 'morning':
      return '#ffd700';
    case 'afternoon':
      return '#ff9800';
    case 'evening':
      return '#673ab7';
    default:
      return '#757575';
  }
};

const capitalizeLabel = (str: string) => {
  if (!str) return '';
  if (str.toLowerCase() === 'in-person') return 'In-person';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

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
};

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

export default function MeetingList({ meetings }: MeetingListProps) {
  if (!meetings || meetings.length === 0) {
    return (
      <Typography variant="body1" align="center">
        No meetings found matching your criteria.
      </Typography>
    );
  }

  const formatDay = (day: string | undefined | null): string => {
    if (!day) return 'Unknown';
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  return (
    <List>
      {meetings.map((meeting, index) => (
        <ListItem key={index} divider>
          <ListItemText
            primary={
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 1,
                flexWrap: 'wrap' // Allow chips to wrap on mobile
              }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 'bold', 
                  color: 'text.primary',
                  fontSize: { xs: '0.9rem', sm: '1rem' } // Smaller text on mobile
                }}>
                  {meeting.name}
                </Typography>
                {meeting.format && (
                  <Chip
                    label={capitalizeLabel(meeting.format)}
                    size="small"
                    sx={{ 
                      backgroundColor: '#455a64', 
                      color: 'white', 
                      fontWeight: 'medium',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' } // Smaller chips on mobile
                    }}
                  />
                )}
                <Chip
                  label={capitalizeLabel(meeting.type)}
                  size="small"
                  sx={{
                    backgroundColor: getTypeColor(meeting.type),
                    color: 'white',
                    fontWeight: 'medium',
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                  }}
                />
                <Chip
                  label={capitalizeLabel(meeting.time)}
                  size="small"
                  sx={{
                    backgroundColor: getTimeColor(meeting.time),
                    color: 'white',
                    fontWeight: 'medium',
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                  }}
                />
              </Box>
            }
            secondary={
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'medium' }}>
                  {formatDay(meeting.day)} at {capitalizeLabel(meeting.timeDisplay)}
                </Typography>
                {meeting.description && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {meeting.description}
                  </Typography>
                )}
                {meeting.zoomId && (
                  <Box>
                    {createZoomLink(meeting) ? (
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        <a 
                          href={createZoomLink(meeting)!} 
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
                        Zoom: {meeting.zoomId}
                      </Typography>
                    )}
                  </Box>
                )}
                {meeting.notes && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}>
                    {meeting.notes}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {cleanAddressDisplay(meeting.address)}
                </Typography>
                {meeting.Contact && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Contact: {meeting.Contact}
                  </Typography>
                )}
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
} 