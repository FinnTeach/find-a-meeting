import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { TimeOfDay, MeetingType } from '../types/Meeting';

interface FilterControlsProps {
  selectedDay: string;
  selectedTime: TimeOfDay | '';
  selectedType: MeetingType | '';
  onDayChange: (day: string) => void;
  onTimeChange: (time: TimeOfDay | '') => void;
  onTypeChange: (type: MeetingType | '') => void;
}

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const times: TimeOfDay[] = ['morning', 'afternoon', 'evening'];
const types: MeetingType[] = ['in-Person', 'virtual', 'hybrid'];

export default function FilterControls({
  selectedDay,
  selectedTime,
  selectedType,
  onDayChange,
  onTimeChange,
  onTypeChange
}: FilterControlsProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth>
        <InputLabel>Day</InputLabel>
        <Select
          value={selectedDay}
          label="Day"
          onChange={(e) => onDayChange(e.target.value)}
        >
          <MenuItem value="">All Days</MenuItem>
          {days.map((day) => (
            <MenuItem key={day} value={day.toLowerCase()}>
              {day}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Time of Day</InputLabel>
        <Select
          value={selectedTime}
          label="Time of Day"
          onChange={(e) => onTimeChange(e.target.value as TimeOfDay | '')}
        >
          <MenuItem value="">All Times</MenuItem>
          {times.map((time) => (
            <MenuItem key={time} value={time}>
              {time.charAt(0).toUpperCase() + time.slice(1)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Meeting Type</InputLabel>
        <Select
          value={selectedType}
          label="Meeting Type"
          onChange={(e) => onTypeChange(e.target.value as MeetingType | '')}
        >
          <MenuItem value="">All Types</MenuItem>
          {types.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
} 