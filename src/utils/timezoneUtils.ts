
import { TIMEZONES } from '@/constants/timeSlots';

// Simple and accurate UTC conversion for exact hour matching
export const convertClientHourToUTC = (clientHour: number, timezoneOffset: number): number => {
  console.log('=== TIMEZONE CONVERSION ===');
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
  console.log('=== END TIMEZONE CONVERSION ===');
  
  return adjustedUtcHour;
};

export const getTimezoneConfig = (timezoneValue: string) => {
  return TIMEZONES.find(tz => tz.value === timezoneValue);
};
