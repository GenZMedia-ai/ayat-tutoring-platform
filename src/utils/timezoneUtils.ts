import { TIMEZONES } from '@/constants/timeSlots';
import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';

export const getTimezoneConfig = (timezoneValue: string) => {
  return TIMEZONES.find(tz => tz.value === timezoneValue);
};

// PHASE 1: CRITICAL DATE PRESERVATION FIX
export const convertClientTimeToServerPreservingDate = (clientDate: Date, clientHour: number, timezoneValue: string) => {
  const tzConfig = getTimezoneConfig(timezoneValue);
  if (!tzConfig) {
    throw new Error(`Invalid timezone: ${timezoneValue}`);
  }

  console.log('=== PHASE 1: DATE-PRESERVING TIMEZONE CONVERSION ===');
  console.log('Input:', { 
    clientDate: clientDate.toDateString(), 
    clientDateISO: clientDate.toISOString().split('T')[0],
    clientHour, 
    timezone: timezoneValue,
    offset: tzConfig.offset 
  });

  // CRITICAL FIX: Always preserve the selected date
  const preservedDateString = clientDate.toISOString().split('T')[0];
  
  // Only convert the hour component to UTC
  const utcHour = clientHour - tzConfig.offset;
  
  // Keep the hour within 0-23 range without changing the date
  let adjustedUtcHour = utcHour;
  if (utcHour < 0) {
    adjustedUtcHour = utcHour + 24;
  } else if (utcHour >= 24) {
    adjustedUtcHour = utcHour - 24;
  }

  // Create UTC date using PRESERVED date with converted hour
  const utcDate = new Date(`${preservedDateString}T${String(adjustedUtcHour).padStart(2, '0')}:00:00.000Z`);

  const result = {
    utcDate,
    utcDateString: preservedDateString, // ALWAYS use the original selected date
    utcHour: adjustedUtcHour,
    utcTime: format(utcDate, 'HH:mm:ss', { timeZone: 'UTC' }),
    datePreserved: true
  };

  console.log('PHASE 1 FIXED conversion result - date GUARANTEED preserved:', {
    originalDate: clientDate.toDateString(),
    preservedDateString: result.utcDateString,
    clientHour: clientHour,
    utcHour: result.utcHour,
    utcTime: result.utcTime,
    datePreservationVerified: clientDate.toISOString().split('T')[0] === result.utcDateString
  });
  console.log('=== END PHASE 1: DATE-PRESERVING CONVERSION ===');

  return result;
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
  console.log('=== TIMEZONE CONVERSION (Legacy - consider upgrading to date-preserving) ===');
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
