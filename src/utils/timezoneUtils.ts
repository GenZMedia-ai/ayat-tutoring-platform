
import { TIMEZONES } from '@/constants/timeSlots';

export const getTimezoneConfig = (timezoneValue: string) => {
  return TIMEZONES.find(tz => tz.value === timezoneValue);
};

// Convert Egypt time (teacher's local time) to UTC for database storage
export const convertEgyptTimeToUTC = (egyptHour: number, egyptMinute: number = 0): string => {
  // Egypt is UTC+2, so subtract 2 hours to get UTC
  const egyptOffset = 2;
  let utcHour = egyptHour - egyptOffset;
  
  // Handle 24-hour boundary
  if (utcHour < 0) {
    utcHour += 24;
  } else if (utcHour >= 24) {
    utcHour -= 24;
  }
  
  return `${String(utcHour).padStart(2, '0')}:${String(egyptMinute).padStart(2, '0')}:00`;
};

// Convert UTC time from database to Egypt time for teacher display
export const convertUTCToEgyptTime = (utcTimeString: string): string => {
  const [hours, minutes] = utcTimeString.split(':').map(Number);
  const egyptOffset = 2;
  let egyptHour = hours + egyptOffset;
  
  // Handle 24-hour boundary
  if (egyptHour >= 24) {
    egyptHour -= 24;
  } else if (egyptHour < 0) {
    egyptHour += 24;
  }
  
  return `${String(egyptHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Simplified timezone conversion for sales availability checker
export const convertClientTimeToServer = (clientDate: Date, clientHour: number, timezoneValue: string) => {
  const tzConfig = getTimezoneConfig(timezoneValue);
  if (!tzConfig) {
    throw new Error(`Invalid timezone: ${timezoneValue}`);
  }

  console.log('=== CLIENT TO UTC CONVERSION ===');
  console.log('Input:', { 
    clientDate: clientDate.toDateString(), 
    clientHour, 
    timezone: timezoneValue,
    offset: tzConfig.offset 
  });

  // Simple conversion: UTC hour = client hour - offset
  const utcHour = clientHour - tzConfig.offset;
  
  // Handle 0-23 boundary
  let adjustedUtcHour = utcHour;
  if (utcHour < 0) {
    adjustedUtcHour = utcHour + 24;
  } else if (utcHour >= 24) {
    adjustedUtcHour = utcHour - 24;
  }

  const result = {
    utcHour: adjustedUtcHour,
    utcTime: `${String(adjustedUtcHour).padStart(2, '0')}:00:00`
  };

  console.log('Client to UTC result:', {
    clientHour: clientHour,
    utcHour: result.utcHour,
    utcTime: result.utcTime
  });

  return result;
};

// Legacy function for backward compatibility
export const convertClientHourToUTC = (clientHour: number, timezoneOffset: number): number => {
  const utcHour = clientHour - timezoneOffset;
  let adjustedUtcHour = utcHour;
  if (utcHour < 0) {
    adjustedUtcHour = utcHour + 24;
  } else if (utcHour >= 24) {
    adjustedUtcHour = utcHour - 24;
  }
  return adjustedUtcHour;
};
