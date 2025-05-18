import { List, ListItem, ListItemText, Typography, Divider, Box, Chip } from '@mui/material';
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
        <div key={index}>
          <ListItem alignItems="flex-start">
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
                    {meeting.name || 'Unnamed Meeting'}
                  </Typography>
                  <Chip
                    label={meeting.type || 'Unknown'}
                    size="small"
                    sx={{
                      backgroundColor: getTypeColor(meeting.type || ''),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                  <Chip
                    label={meeting.time ? meeting.time.charAt(0).toUpperCase() + meeting.time.slice(1) : 'Unknown'}
                    size="small"
                    sx={{
                      backgroundColor: getTimeColor(meeting.time || ''),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              }
              secondary={
                <>
                  {meeting.description && (
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {meeting.description}
                    </Typography>
                  )}
                  <Typography component="span" variant="body2" color="text.primary" sx={{ display: 'block' }}>
                    {formatDay(meeting.day)} - {meeting.timeDisplay || 'Time not specified'}
                  </Typography>
                  {meeting.address && (
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                      {meeting.address}
                    </Typography>
                  )}
                </>
              }
            />
          </ListItem>
          {index < meetings.length - 1 && <Divider />}
        </div>
      ))}
    </List>
  );
} 