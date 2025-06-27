
import { format, addHours } from 'date-fns';

// Egypt timezone utilities for teacher availability
export const EGYPT_TIMEZONE = 'Africa/Cairo';
export const EGYPT_UTC_OFFSET_WINTER = 2; // UTC+2 (standard time)
export const EGYPT_UTC_OFFSET_SUMMER = 3; // UTC+3 (daylight saving time)

// Convert Egypt time to UTC
export const convertEgyptTimeToUTC = (egyptTime: string, date: Date): string => {
  console.log('🇪🇬 Converting Egypt time to UTC:', { egyptTime, date: date.toDateString() });
  
  // Parse Egypt time (HH:MM format)
  const [hours, minutes] = egyptTime.split(':').map(Number);
  
  // Create Egypt datetime
  const egyptDateTime = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes || 0,
    0
  );
  
  // Determine if DST is active (rough approximation for Egypt DST)
  // Egypt typically observes DST from late March to late October
  const month = date.getMonth() + 1; // 1-12
  const isDST = month >= 4 && month <= 10; // Approximate DST period
  
  const offsetHours = isDST ? EGYPT_UTC_OFFSET_SUMMER : EGYPT_UTC_OFFSET_WINTER;
  
  // Convert to UTC by subtracting Egypt offset
  const utcDateTime = addHours(egyptDateTime, -offsetHours);
  
  const utcTime = format(utcDateTime, 'HH:mm:ss');
  
  console.log('🕒 Egypt to UTC conversion:', {
    egyptTime,
    offsetHours,
    isDST,
    utcTime,
    egyptDateTime: egyptDateTime.toISOString(),
    utcDateTime: utcDateTime.toISOString()
  });
  
  return utcTime;
};

// Convert UTC time to Egypt time for display
export const convertUTCToEgyptTime = (utcTime: string, date: Date): string => {
  console.log('🌍 Converting UTC time to Egypt:', { utcTime, date: date.toDateString() });
  
  // Parse UTC time
  const [hours, minutes, seconds] = utcTime.split(':').map(Number);
  
  // Create UTC datetime
  const utcDateTime = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes || 0, seconds || 0)
  );
  
  // Determine DST
  const month = date.getMonth() + 1;
  const isDST = month >= 4 && month <= 10;
  const offsetHours = isDST ? EGYPT_UTC_OFFSET_SUMMER : EGYPT_UTC_OFFSET_WINTER;
  
  // Convert to Egypt time by adding offset
  const egyptDateTime = addHours(utcDateTime, offsetHours);
  const egyptTime = format(egyptDateTime, 'HH:mm');
  
  console.log('🕒 UTC to Egypt conversion:', {
    utcTime,
    offsetHours,
    isDST,
    egyptTime
  });
  
  return egyptTime;
};

// Format time in 12-hour format with AM/PM
export const formatTo12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Generate time slots in 12-hour format for Egypt timezone
export const generateEgyptTimeSlots = (): Array<{ time24: string; time12: string }> => {
  const slots = [];
  
  // Generate slots from 8:00 AM to 10:00 PM (22:00) in 30-minute intervals
  for (let hour = 8; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const time12 = formatTo12Hour(time24);
      
      slots.push({ time24, time12 });
    }
  }
  
  return slots;
};
