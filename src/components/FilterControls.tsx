import { FormControl, InputLabel, Select, MenuItem, Box, Button } from '@mui/material';
import { TimeOfDay, MeetingType } from '../types/Meeting';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface FilterControlsProps {
  selectedDay: string;
  selectedTime: TimeOfDay | '';
  selectedType: MeetingType | '';
  selectedFormat?: string;
  onDayChange: (day: string) => void;
  onTimeChange: (time: TimeOfDay | '') => void;
  onTypeChange: (type: MeetingType | '') => void;
  onFormatChange?: (format: string) => void;
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
  selectedFormat = '',
  onDayChange,
  onTimeChange,
  onTypeChange,
  onFormatChange,
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
    onFormatChange && onFormatChange('');
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: { xs: 1, sm: 2 }, 
      alignItems: 'center',
      flexWrap: 'wrap' // Allow wrapping on mobile
    }}>
      <FormControl sx={{ 
        minWidth: { xs: 150, sm: 180, md: 200 },
        flex: { xs: '1 1 45%', sm: 'none' } // Take up more space on mobile
      }}>
        <InputLabel sx={{ color, fontSize: { xs: '0.9rem', sm: '1rem' } }}>Day</InputLabel>
        <Select
          value={selectedDay}
          label="Day"
          onChange={(e: any) => handleDayChange(e.target.value)}
          sx={{ color }}
          size="small"
        >
          <MenuItem value="">All Days</MenuItem>
          {days.map((day) => (
            <MenuItem key={day} value={day.toLowerCase()}>
              {day}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ 
        minWidth: { xs: 150, sm: 180, md: 200 },
        flex: { xs: '1 1 45%', sm: 'none' }
      }}>
        <InputLabel sx={{ color, fontSize: { xs: '0.9rem', sm: '1rem' } }}>Format</InputLabel>
        <Select
          value={selectedFormat}
          label="Format"
          onChange={(e: any) => onFormatChange && onFormatChange(e.target.value)}
          sx={{ color }}
          size="small"
        >
          <MenuItem value="">All Formats</MenuItem>
          <MenuItem value="Regular">Regular</MenuItem>
          <MenuItem value="Beginner">Beginner</MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ 
        minWidth: { xs: 150, sm: 180, md: 200 },
        flex: { xs: '1 1 45%', sm: 'none' }
      }}>
        <InputLabel sx={{ color, fontSize: { xs: '0.9rem', sm: '1rem' } }}>Time of Day</InputLabel>
        <Select
          value={selectedTime}
          label="Time of Day"
          onChange={(e: any) => handleTimeChange(e.target.value)}
          sx={{ color }}
          size="small"
        >
          <MenuItem value="">All Times</MenuItem>
          {times.map((time) => (
            <MenuItem key={time} value={time}>
              {capitalizeFirstLetter(time)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ 
        minWidth: { xs: 150, sm: 180, md: 200 },
        flex: { xs: '1 1 45%', sm: 'none' }
      }}>
        <InputLabel sx={{ color, fontSize: { xs: '0.9rem', sm: '1rem' } }}>Meeting Type</InputLabel>
        <Select
          value={selectedType}
          label="Meeting Type"
          onChange={(e: any) => handleTypeChange(e.target.value)}
          sx={{ color }}
          size="small"
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
          fontSize: { xs: '0.8rem', sm: '0.875rem' },
          minWidth: { xs: 'auto', sm: '120px' },
          flex: { xs: '1 1 100%', sm: 'none' }, // Full width on mobile
          mt: { xs: 1, sm: 0 }, // Add top margin on mobile
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