
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

// FIXED: Complete datetime conversion for sales availability checker
export const convertClientTimeToServer = (clientDate: Date, clientHour: number, timezoneValue: string) => {
  const tzConfig = getTimezoneConfig(timezoneValue);
  if (!tzConfig) {
    throw new Error(`Invalid timezone: ${timezoneValue}`);
  }

  console.log('=== FIXED CLIENT TO UTC CONVERSION ===');
  console.log('Input:', { 
    clientDate: clientDate.toDateString(), 
    clientHour, 
    timezone: timezoneValue,
    offset: tzConfig.offset 
  });

  // Get UTC date components to avoid server timezone dependency
  const year = clientDate.getUTCFullYear();
  const month = clientDate.getUTCMonth();
  const day = clientDate.getUTCDate();

  // Create date at client hour in UTC
  const tempUtcDate = new Date(Date.UTC(year, month, day, clientHour, 0, 0));

  // Adjust for client timezone offset
  const correctUtcTimestamp = tempUtcDate.getTime() - (tzConfig.offset * 60 * 60 * 1000);
  const utcDateTime = new Date(correctUtcTimestamp);

  // Extract the correct UTC date and hour
  const utcDateStr = utcDateTime.toISOString().split('T')[0];
  const utcHour = utcDateTime.getUTCHours();

  const result = {
    utcHour,
    utcDateStr,
    utcTime: `${String(utcHour).padStart(2, '0')}:00:00`
  };

  console.log('FIXED Conversion Result:', {
    clientDateTime: tempUtcDate.toISOString(),
    utcDateTime: utcDateTime.toISOString(),
    utcDate: result.utcDateStr,
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
