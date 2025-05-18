import { List, ListItem, ListItemText, Typography, Divider } from '@mui/material';
import { Meeting } from '../types/Meeting';

interface MeetingListProps {
  meetings: Meeting[];
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
        <div key={index}>
          <ListItem alignItems="flex-start">
            <ListItemText
              primary={meeting.name || 'Unnamed Meeting'}
              secondary={
                <>
                  <Typography component="span" variant="body2" color="text.primary">
                    {formatDay(meeting.day)} - {meeting.timeDisplay || 'Time not specified'}
                  </Typography>
                  <br />
                  <Typography component="span" variant="body2" color="text.secondary">
                    {meeting.type || 'Type not specified'} Meeting
                  </Typography>
                  {meeting.address && (
                    <>
                      <br />
                      <Typography component="span" variant="body2" color="text.secondary">
                        {meeting.address}
                      </Typography>
                    </>
                  )}
                  {meeting.description && (
                    <>
                      <br />
                      <Typography component="span" variant="body2" color="text.secondary">
                        {meeting.description}
                      </Typography>
                    </>
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