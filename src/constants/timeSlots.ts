// Extended time slots from 8 AM to 10 PM for availability checking
export const HOURLY_TIME_SLOTS = [
  { value: -1, label: 'All Time', utcHour: -1 }, // New "All Time" option
  { value: 8, label: '8:00 AM', utcHour: 8 },
  { value: 9, label: '9:00 AM', utcHour: 9 },
  { value: 10, label: '10:00 AM', utcHour: 10 },
  { value: 11, label: '11:00 AM', utcHour: 11 },
  { value: 12, label: '12:00 PM', utcHour: 12 },
  { value: 13, label: '1:00 PM', utcHour: 13 },
  { value: 14, label: '2:00 PM', utcHour: 14 },
  { value: 15, label: '3:00 PM', utcHour: 15 },
  { value: 16, label: '4:00 PM', utcHour: 16 },
  { value: 17, label: '5:00 PM', utcHour: 17 },
  { value: 18, label: '6:00 PM', utcHour: 18 },
  { value: 19, label: '7:00 PM', utcHour: 19 },
  { value: 20, label: '8:00 PM', utcHour: 20 },
  { value: 21, label: '9:00 PM', utcHour: 21 },
  { value: 22, label: '10:00 PM', utcHour: 22 }
] as const;

// Timezone configurations with UTC offsets and IANA identifiers
export const TIMEZONES = [
  { value: 'saudi', label: 'Saudi Arabia (GMT+3)', offset: 3, iana: 'Asia/Riyadh' },
  { value: 'uae', label: 'UAE (GMT+4)', offset: 4, iana: 'Asia/Dubai' },
  { value: 'qatar', label: 'Qatar (GMT+3)', offset: 3, iana: 'Asia/Qatar' },
  { value: 'kuwait', label: 'Kuwait (GMT+3)', offset: 3, iana: 'Asia/Kuwait' },
  { value: 'bahrain', label: 'Bahrain (GMT+3)', offset: 3, iana: 'Asia/Bahrain' },
  { value: 'oman', label: 'Oman (GMT+4)', offset: 4, iana: 'Asia/Muscat' }
] as const;

// Convert client timezone hour to UTC hour range with comprehensive debugging
export const convertToUTCRange = (clientHour: number, timezoneOffset: number) => {
  console.log('=== TIMEZONE CONVERSION DEBUG ===');
  console.log('Input - Client Hour:', clientHour, 'Timezone Offset:', timezoneOffset);
  
  // Convert client time to UTC
  const utcHour = clientHour - timezoneOffset;
  console.log('Raw UTC Hour (before boundary handling):', utcHour);
  
  // Handle day boundary crossings
  let startHour = utcHour;
  if (utcHour < 0) {
    startHour = utcHour + 24;
    console.log('Negative UTC hour, adjusting:', startHour);
  } else if (utcHour >= 24) {
    startHour = utcHour - 24;
    console.log('UTC hour >= 24, adjusting:', startHour);
  }
  
  const endHour = startHour === 23 ? 0 : startHour + 1;
  const crossesMidnight = utcHour < 0 || utcHour >= 24;
  
  const result = {
    startTime: `${String(startHour).padStart(2, '0')}:00:00`,
    endTime: `${String(endHour).padStart(2, '0')}:00:00`,
    crossesMidnight
  };
  
  console.log('Final conversion result:', result);
  console.log('=== END TIMEZONE CONVERSION ===');
  
  return result;
};
