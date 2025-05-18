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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  {meeting.name}
                </Typography>
                <Chip
                  label={capitalizeLabel(meeting.type)}
                  size="small"
                  sx={{
                    backgroundColor: getTypeColor(meeting.type),
                    color: 'white',
                    fontWeight: 'medium'
                  }}
                />
                <Chip
                  label={capitalizeLabel(meeting.time)}
                  size="small"
                  sx={{
                    backgroundColor: getTimeColor(meeting.time),
                    color: 'white',
                    fontWeight: 'medium'
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
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {meeting.address}
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