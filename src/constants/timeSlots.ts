
// Simple 1-hour time slots for availability checking
export const HOURLY_TIME_SLOTS = [
  { value: 13, label: '1:00 PM', utcHour: 13 },
  { value: 14, label: '2:00 PM', utcHour: 14 },
  { value: 15, label: '3:00 PM', utcHour: 15 },
  { value: 16, label: '4:00 PM', utcHour: 16 },
  { value: 17, label: '5:00 PM', utcHour: 17 },
  { value: 18, label: '6:00 PM', utcHour: 18 },
  { value: 19, label: '7:00 PM', utcHour: 19 },
  { value: 20, label: '8:00 PM', utcHour: 20 },
  { value: 21, label: '9:00 PM', utcHour: 21 },
  { value: 22, label: '10:00 PM', utcHour: 22 },
  { value: 23, label: '11:00 PM', utcHour: 23 }
] as const;

// Timezone configurations with UTC offsets
export const TIMEZONES = [
  { value: 'saudi', label: 'Saudi Arabia (GMT+3)', offset: 3 },
  { value: 'uae', label: 'UAE (GMT+4)', offset: 4 },
  { value: 'qatar', label: 'Qatar (GMT+3)', offset: 3 },
  { value: 'kuwait', label: 'Kuwait (GMT+3)', offset: 3 },
  { value: 'bahrain', label: 'Bahrain (GMT+3)', offset: 3 },
  { value: 'oman', label: 'Oman (GMT+4)', offset: 4 }
] as const;

// Convert client timezone hour to UTC hour range
export const convertToUTCRange = (clientHour: number, timezoneOffset: number) => {
  const utcHour = clientHour - timezoneOffset;
  
  // Handle day boundary crossings
  const startHour = utcHour < 0 ? utcHour + 24 : utcHour >= 24 ? utcHour - 24 : utcHour;
  const endHour = startHour === 23 ? 0 : startHour + 1;
  
  return {
    startTime: `${String(startHour).padStart(2, '0')}:00:00`,
    endTime: `${String(endHour).padStart(2, '0')}:00:00`,
    crossesMidnight: utcHour < 0 || utcHour >= 24
  };
};
