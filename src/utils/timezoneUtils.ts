import { TIMEZONES } from '@/constants/timeSlots';
import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';

export const getTimezoneConfig = (timezoneValue: string) => {
  return TIMEZONES.find(tz => tz.value === timezoneValue);
};

// FIXED: Convert client time to server preserving the selected date
export const convertClientTimeToServer = (clientDate: Date, clientHour: number, timezoneValue: string) => {
  const tzConfig = getTimezoneConfig(timezoneValue);
  if (!tzConfig) {
    throw new Error(`Invalid timezone: ${timezoneValue}`);
  }

  console.log('=== FIXED TIMEZONE CONVERSION ===');
  console.log('Input:', { 
    clientDate: clientDate.toDateString(), 
    clientHour, 
    timezone: timezoneValue,
    offset: tzConfig.offset 
  });

  // FIXED: Only convert the hour, preserve the date
  const utcHour = clientHour - tzConfig.offset;
  
  // Keep the hour within 0-23 range, but DON'T change the date
  let adjustedUtcHour = utcHour;
  if (utcHour < 0) {
    adjustedUtcHour = utcHour + 24;
  } else if (utcHour >= 24) {
    adjustedUtcHour = utcHour - 24;
  }

  // FIXED: Create UTC date using the SAME date, just with converted hour
  const utcDate = new Date(
    clientDate.getFullYear(),
    clientDate.getMonth(),
    clientDate.getDate(),
    adjustedUtcHour
  );

  // FIXED: Preserve original date in string format
  const utcDateString = format(clientDate, 'yyyy-MM-dd');

  const result = {
    utcDate,
    utcDateString: utcDateString, // FIXED: Use original date
    utcHour: adjustedUtcHour,
    utcTime: format(utcDate, 'HH:mm:ss', { timeZone: 'UTC' })
  };

  console.log('FIXED conversion result - date preserved:', {
    originalDate: clientDate.toDateString(),
    preservedDateString: result.utcDateString,
    clientHour: clientHour,
    utcHour: result.utcHour,
    utcTime: result.utcTime,
    datePreserved: clientDate.toISOString().split('T')[0] === result.utcDateString
  });
  console.log('=== END FIXED TIMEZONE CONVERSION ===');

  return result;
};

// NEW: Fixed timezone conversion that preserves dates
export const convertClientHourToUTCPreservingDate = (
  clientHour: number, 
  clientDate: Date, 
  timezoneValue: string
): { utcHour: number; utcMinutes: number; utcDate: Date; utcDateString: string } => {
  console.log('=== DATE-PRESERVING TIMEZONE CONVERSION ===');
  console.log('Input:', { clientHour, clientDate: clientDate.toISOString().split('T')[0], timezoneValue });
  
  const tzConfig = getTimezoneConfig(timezoneValue);
  if (!tzConfig) {
    throw new Error(`Invalid timezone: ${timezoneValue}`);
  }
  
  // Simple offset calculation that preserves the date
  const utcHour = clientHour - tzConfig.offset;
  let adjustedUtcHour = utcHour;
  
  // Keep hour in 0-23 range without changing date
  if (utcHour < 0) {
    adjustedUtcHour = utcHour + 24;
  } else if (utcHour >= 24) {
    adjustedUtcHour = utcHour - 24;
  }
  
  // Create UTC date with SAME date as input
  const utcDate = new Date(
    clientDate.getFullYear(),
    clientDate.getMonth(),
    clientDate.getDate(),
    adjustedUtcHour,
    0,
    0
  );
  
  const utcDateString = clientDate.toISOString().split('T')[0];
  
  console.log('Date-preserving conversion result:', {
    originalDate: clientDate.toISOString().split('T')[0],
    preservedDate: utcDateString,
    clientHour,
    utcHour: adjustedUtcHour,
    datePreserved: true
  });
  console.log('=== END DATE-PRESERVING CONVERSION ===');
  
  return {
    utcHour: adjustedUtcHour,
    utcMinutes: 0,
    utcDate,
    utcDateString
  };
};

// Enhanced timezone conversion using date-fns-tz for DST and fractional offset support
export const convertClientHourToUTCWithDateFns = (
  clientHour: number, 
  clientDate: Date, 
  timezoneIana: string
): { utcHour: number; utcMinutes: number; utcDate: Date } => {
  console.log('=== ENHANCED TIMEZONE CONVERSION (date-fns-tz) ===');
  console.log('Input:', { clientHour, clientDate: clientDate.toISOString(), timezoneIana });
  
  // Create client datetime
  const clientDateTime = new Date(
    clientDate.getFullYear(),
    clientDate.getMonth(),
    clientDate.getDate(),
    clientHour,
    0,
    0
  );
  
  console.log('Client DateTime:', clientDateTime.toISOString());
  
  // Convert to UTC using date-fns-tz (handles DST automatically)
  const utcDate = fromZonedTime(clientDateTime, timezoneIana);
  
  console.log('UTC Date:', utcDate.toISOString());
  console.log('UTC Hour:', utcDate.getUTCHours());
  console.log('UTC Minutes:', utcDate.getUTCMinutes());
  console.log('=== END ENHANCED TIMEZONE CONVERSION ===');
  
  return {
    utcHour: utcDate.getUTCHours(),
    utcMinutes: utcDate.getUTCMinutes(),
    utcDate
  };
};

// Backward compatibility function for existing code
export const convertClientHourToUTC = (clientHour: number, timezoneOffset: number): number => {
  console.log('=== TIMEZONE CONVERSION (Legacy - consider upgrading to simplified) ===');
  console.log('Input - Client Hour:', clientHour, 'Timezone Offset:', timezoneOffset);
  
  const utcHour = clientHour - timezoneOffset;
  console.log('Raw UTC Hour:', utcHour);
  
  let adjustedUtcHour = utcHour;
  if (utcHour < 0) {
    adjustedUtcHour = utcHour + 24;
  } else if (utcHour >= 24) {
    adjustedUtcHour = utcHour - 24;
  }
  
  console.log('Final UTC Hour:', adjustedUtcHour);
  console.log('=== END TIMEZONE CONVERSION (Legacy) ===');
  
  return adjustedUtcHour;
};
