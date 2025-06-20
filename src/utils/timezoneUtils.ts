
import { TIMEZONES } from '@/constants/timeSlots';
import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';

export const getTimezoneConfig = (timezoneValue: string) => {
  return TIMEZONES.find(tz => tz.value === timezoneValue);
};

export const convertClientTimeToServer = (clientDate: Date, clientHour: number, timezoneValue: string) => {
  const tzConfig = getTimezoneConfig(timezoneValue);
  if (!tzConfig) {
    throw new Error(`Invalid timezone: ${timezoneValue}`);
  }

  const dateWithHour = new Date(
    clientDate.getFullYear(),
    clientDate.getMonth(),
    clientDate.getDate(),
    clientHour
  );

  const utcDate = fromZonedTime(dateWithHour, tzConfig.iana);

  return {
    utcDate,
    utcDateString: format(utcDate, 'yyyy-MM-dd', { timeZone: 'UTC' }),
    utcHour: utcDate.getUTCHours(),
    utcTime: format(utcDate, 'HH:mm:ss', { timeZone: 'UTC' })
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
  console.log('=== TIMEZONE CONVERSION (Legacy - consider upgrading to date-fns-tz) ===');
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
