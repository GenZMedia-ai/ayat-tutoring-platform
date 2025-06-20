
export interface GranularTimeSlot {
  id: string;
  startTime: string; // e.g., "18:00"
  endTime: string;   // e.g., "18:30"
  clientTimeDisplay: string; // e.g., "6:00-6:30 PM"
  egyptTimeDisplay: string;  // e.g., "4:00-4:30 PM (Egypt)"
  utcStartTime: string; // e.g., "14:00:00"
  utcEndTime: string;   // e.g., "14:30:00"
  teacherId: string;
  teacherName: string;
  teacherType: string;
  isBooked: boolean;
}

export interface TimezoneConfig {
  value: string;
  label: string;
  offset: number;
  displayName: string;
}

export interface AvailabilitySearchParams {
  date: Date;
  timezone: string;
  teacherType: string;
  selectedHour: number;
}
