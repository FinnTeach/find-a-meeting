import { FormControl, InputLabel, Select, MenuItem, Box, Button } from '@mui/material';
import { TimeOfDay, MeetingType } from '../types/Meeting';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface FilterControlsProps {
  selectedDay: string;
  selectedTime: TimeOfDay | '';
  selectedType: MeetingType | '';
  onDayChange: (day: string) => void;
  onTimeChange: (time: TimeOfDay | '') => void;
  onTypeChange: (type: MeetingType | '') => void;
  color?: string;
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
  onTypeChange,
  color = '#0d2357'
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

  const handleReset = () => {
    onDayChange('');
    onTimeChange('');
    onTypeChange('');
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel sx={{ color }}>Day</InputLabel>
        <Select
          value={selectedDay}
          label="Day"
          onChange={(e) => handleDayChange(e.target.value)}
          sx={{ color }}
        >
          <MenuItem value="">All Days</MenuItem>
          {days.map((day) => (
            <MenuItem key={day} value={day.toLowerCase()}>
              {day}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel sx={{ color }}>Time of Day</InputLabel>
        <Select
          value={selectedTime}
          label="Time of Day"
          onChange={(e) => handleTimeChange(e.target.value)}
          sx={{ color }}
        >
          <MenuItem value="">All Times</MenuItem>
          {times.map((time) => (
            <MenuItem key={time} value={time}>
              {capitalizeFirstLetter(time)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel sx={{ color }}>Meeting Type</InputLabel>
        <Select
          value={selectedType}
          label="Meeting Type"
          onChange={(e) => handleTypeChange(e.target.value)}
          sx={{ color }}
        >
          <MenuItem value="">All Types</MenuItem>
          {types.map((type) => (
            <MenuItem key={type} value={type}>
              {type === 'in-Person' ? 'In-Person' : capitalizeFirstLetter(type)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="outlined"
        onClick={handleReset}
        startIcon={<RestartAltIcon />}
        sx={{
          color,
          borderColor: color,
          '&:hover': {
            borderColor: color,
            backgroundColor: 'rgba(13, 35, 87, 0.04)'
          }
        }}
      >
        Reset Filters
      </Button>
    </Box>
  );
} 