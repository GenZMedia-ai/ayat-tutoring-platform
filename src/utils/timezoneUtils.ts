
import { TIMEZONES } from '@/constants/timeSlots';

export const getTimezoneConfig = (timezoneValue: string) => {
  return TIMEZONES.find(tz => tz.value === timezoneValue);
};

// Simplified timezone conversion for the sales availability checker
export const convertClientTimeToServer = (clientDate: Date, clientHour: number, timezoneValue: string) => {
  const tzConfig = getTimezoneConfig(timezoneValue);
  if (!tzConfig) {
    throw new Error(`Invalid timezone: ${timezoneValue}`);
  }

  console.log('=== SIMPLIFIED TIMEZONE CONVERSION ===');
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

  // Preserve original date
  const utcDate = new Date(
    clientDate.getFullYear(),
    clientDate.getMonth(),
    clientDate.getDate(),
    adjustedUtcHour
  );

  const utcDateString = clientDate.toISOString().split('T')[0]; // Keep original date

  const result = {
    utcDate,
    utcDateString,
    utcHour: adjustedUtcHour,
    utcTime: `${String(adjustedUtcHour).padStart(2, '0')}:00:00`
  };

  console.log('Conversion result:', {
    originalDate: clientDate.toDateString(),
    preservedDateString: result.utcDateString,
    clientHour: clientHour,
    utcHour: result.utcHour,
    utcTime: result.utcTime
  });
  console.log('=== END TIMEZONE CONVERSION ===');

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
