export type TimeOfDay = 'morning' | 'afternoon' | 'evening';
export type MeetingType = 'in-Person' | 'virtual' | 'hybrid';

export interface Meeting {
  name: string;
  description: string;
  day: string;
  time: TimeOfDay;
  timeDisplay: string;
  type: MeetingType;
  address: string;
  Contact: string;
  zoomId?: string;
  notes?: string;
  format?: string;
  coordinates?: [number, number] | null; // [latitude, longitude]
} 