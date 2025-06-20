
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

  // Create a date with the specified hour in the client's timezone
  const dateWithHour = new Date(
    clientDate.getFullYear(),
    clientDate.getMonth(),
    clientDate.getDate(),
    clientHour,
    0,
    0
  );

  // Convert to UTC using proper timezone handling
  const utcDate = fromZonedTime(dateWithHour, tzConfig.iana);

  return {
    utcDate,
    utcDateString: format(utcDate, 'yyyy-MM-dd', { timeZone: 'UTC' }),
    utcTimeString: format(utcDate, 'HH:mm:ss', { timeZone: 'UTC' }),
    utcHour: utcDate.getUTCHours(),
  };
};

export const convertServerTimeToClient = (utcTimeString: string, date: Date, timezoneValue: string) => {
  const tzConfig = getTimezoneConfig(timezoneValue);
  if (!tzConfig) {
    throw new Error(`Invalid timezone: ${timezoneValue}`);
  }

  // Parse UTC time
  const [hours, minutes] = utcTimeString.split(':').map(Number);
  const utcDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0
  );
  utcDate.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  utcDate.setUTCHours(hours, minutes, 0, 0);

  // Convert to client timezone
  const clientDate = toZonedTime(utcDate, tzConfig.iana);
  
  return {
    clientDate,
    clientTimeDisplay: format(clientDate, 'h:mm a', { timeZone: tzConfig.iana }),
    clientHour: clientDate.getHours(),
  };
};

// Legacy function for backward compatibility - now uses proper timezone conversion
export const convertClientHourToUTC = (clientHour: number, timezoneOffset: number): number => {
  console.warn('convertClientHourToUTC is deprecated, use convertClientTimeToServer instead');
  return (clientHour - timezoneOffset + 24) % 24;
};
