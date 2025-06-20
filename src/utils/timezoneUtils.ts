
import { TIMEZONES } from '@/constants/timeSlots';

export interface TimeRange {
  utcStartTime: string;
  utcEndTime: string;
  clientDisplay: string;
  egyptDisplay: string;
}

// Convert client timezone hour to UTC with proper granular slots
export const convertClientHourToUTCRanges = (
  clientHour: number,
  timezoneOffset: number
): TimeRange[] => {
  console.log('=== TIMEZONE CONVERSION DEBUG ===');
  console.log('Input - Client Hour:', clientHour, 'Timezone Offset:', timezoneOffset);
  
  const ranges: TimeRange[] = [];
  
  // Create two 30-minute slots within the hour
  for (let minutes = 0; minutes < 60; minutes += 30) {
    const clientMinutes = clientHour * 60 + minutes;
    const utcMinutes = clientMinutes - (timezoneOffset * 60);
    
    // Handle day boundary crossings
    let utcHours = Math.floor(utcMinutes / 60);
    let utcMins = utcMinutes % 60;
    
    if (utcHours < 0) {
      utcHours += 24;
    } else if (utcHours >= 24) {
      utcHours -= 24;
    }
    
    if (utcMins < 0) {
      utcMins += 60;
      utcHours -= 1;
      if (utcHours < 0) utcHours += 24;
    }
    
    const startUtcTime = `${String(utcHours).padStart(2, '0')}:${String(utcMins).padStart(2, '0')}:00`;
    
    // Calculate end time (30 minutes later)
    let endUtcMinutes = utcMinutes + 30;
    let endUtcHours = Math.floor(endUtcMinutes / 60);
    let endUtcMins = endUtcMinutes % 60;
    
    if (endUtcHours >= 24) {
      endUtcHours -= 24;
    }
    
    const endUtcTime = `${String(endUtcHours).padStart(2, '0')}:${String(endUtcMins).padStart(2, '0')}:00`;
    
    // Calculate Egypt time (UTC+2)
    const egyptMinutes = utcMinutes + (2 * 60);
    let egyptHours = Math.floor(egyptMinutes / 60);
    let egyptMins = egyptMinutes % 60;
    
    if (egyptHours >= 24) {
      egyptHours -= 24;
    } else if (egyptHours < 0) {
      egyptHours += 24;
    }
    
    if (egyptMins < 0) {
      egyptMins += 60;
      egyptHours -= 1;
      if (egyptHours < 0) egyptHours += 24;
    }
    
    const egyptEndMinutes = egyptMinutes + 30;
    let egyptEndHours = Math.floor(egyptEndMinutes / 60);
    let egyptEndMins = egyptEndMinutes % 60;
    
    if (egyptEndHours >= 24) {
      egyptEndHours -= 24;
    }
    
    // Format display times
    const clientStartHour = clientHour;
    const clientStartMin = minutes;
    const clientEndMin = minutes + 30;
    const clientEndHour = clientEndMin >= 60 ? clientStartHour + 1 : clientStartHour;
    const adjustedClientEndMin = clientEndMin >= 60 ? 0 : clientEndMin;
    
    const formatTime = (hour: number, min: number) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${String(min).padStart(2, '0')} ${period}`;
    };
    
    const clientDisplay = `${formatTime(clientStartHour, clientStartMin)}-${formatTime(clientEndHour, adjustedClientEndMin)}`;
    const egyptDisplay = `${formatTime(egyptHours, egyptMins)}-${formatTime(egyptEndHours, egyptEndMins)} (Egypt)`;
    
    ranges.push({
      utcStartTime: startUtcTime,
      utcEndTime: endUtcTime,
      clientDisplay,
      egyptDisplay
    });
    
    console.log(`Slot ${minutes/30 + 1}:`, {
      clientTime: clientDisplay,
      egyptTime: egyptDisplay,
      utcRange: `${startUtcTime} - ${endUtcTime}`
    });
  }
  
  console.log('=== END TIMEZONE CONVERSION ===');
  return ranges;
};

export const getTimezoneConfig = (timezoneValue: string) => {
  return TIMEZONES.find(tz => tz.value === timezoneValue);
};
