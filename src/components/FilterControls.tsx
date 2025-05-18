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

const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function FilterControls({
  selectedDay,
  selectedTime,
  selectedType,
  onDayChange,
  onTimeChange,
  onTypeChange
}: FilterControlsProps) {
  const handleDayChange = (value: string) => {
    onDayChange(value.toLowerCase());
  };

  const handleTimeChange = (value: string) => {
    onTimeChange(value as TimeOfDay | '');
  };

  const handleTypeChange = (value: string) => {
    onTypeChange(value as MeetingType | '');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth>
        <InputLabel>Day</InputLabel>
        <Select
          value={selectedDay}
          label="Day"
          onChange={(e) => handleDayChange(e.target.value)}
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
          onChange={(e) => handleTimeChange(e.target.value)}
        >
          <MenuItem value="">All Times</MenuItem>
          {times.map((time) => (
            <MenuItem key={time} value={time}>
              {capitalizeFirstLetter(time)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Meeting Type</InputLabel>
        <Select
          value={selectedType}
          label="Meeting Type"
          onChange={(e) => handleTypeChange(e.target.value)}
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