
import { GranularTimeSlot } from './availability';

export interface GroupedTimeSlot {
  timeDisplay: string;
  egyptTimeDisplay: string;
  availableTeachers: number;
  slots: GranularTimeSlot[];
  utcStartTime: string;
  utcEndTime: string;
}

export interface RoundRobinBookingData {
  studentName: string;
  country: string;
  phone: string;
  platform: 'zoom' | 'google-meet';
  age: number;
  notes?: string;
  parentName?: string;
  students?: { name: string; age: number }[];
}
