
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
    // Calculate UTC time correctly
    const utcHour = clientHour - timezoneOffset;
    let adjustedUtcHour = utcHour;
    
    // Handle day boundary crossings
    if (utcHour < 0) {
      adjustedUtcHour = utcHour + 24;
    } else if (utcHour >= 24) {
      adjustedUtcHour = utcHour - 24;
    }
    
    const startUtcTime = `${String(adjustedUtcHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    
    // Calculate end time (30 minutes later)
    const endMinutes = minutes + 30;
    let endHour = adjustedUtcHour;
    let finalEndMinutes = endMinutes;
    
    if (endMinutes >= 60) {
      endHour += 1;
      finalEndMinutes = 0;
      if (endHour >= 24) {
        endHour = 0;
      }
    }
    
    const endUtcTime = `${String(endHour).padStart(2, '0')}:${String(finalEndMinutes).padStart(2, '0')}:00`;
    
    // Calculate Egypt time (UTC+2)
    const egyptHour = adjustedUtcHour + 2;
    let adjustedEgyptHour = egyptHour;
    
    if (egyptHour >= 24) {
      adjustedEgyptHour = egyptHour - 24;
    } else if (egyptHour < 0) {
      adjustedEgyptHour = egyptHour + 24;
    }
    
    const egyptEndHour = adjustedEgyptHour + (endMinutes >= 60 ? 1 : 0);
    let adjustedEgyptEndHour = egyptEndHour >= 24 ? egyptEndHour - 24 : egyptEndHour;
    
    // Format display times
    const formatTime = (hour: number, min: number) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${String(min).padStart(2, '0')} ${period}`;
    };
    
    const clientStartMin = minutes;
    const clientEndMin = endMinutes >= 60 ? 0 : endMinutes;
    const clientEndHour = endMinutes >= 60 ? clientHour + 1 : clientHour;
    
    const clientDisplay = `${formatTime(clientHour, clientStartMin)}-${formatTime(clientEndHour, clientEndMin)}`;
    const egyptDisplay = `${formatTime(adjustedEgyptHour, minutes)}-${formatTime(adjustedEgyptEndHour, finalEndMinutes)} (Egypt)`;
    
    ranges.push({
      utcStartTime: startUtcTime,
      utcEndTime: endUtcTime,
      clientDisplay,
      egyptDisplay
    });
    
    console.log(`Slot ${minutes/30 + 1}:`, {
      clientTime: clientDisplay,
      egyptTime: egyptDisplay,
      utcRange: `${startUtcTime} - ${endUtcTime}`,
      calculations: {
        originalClientHour: clientHour,
        timezoneOffset: timezoneOffset,
        rawUtcHour: utcHour,
        adjustedUtcHour: adjustedUtcHour,
        egyptHour: adjustedEgyptHour
      }
    });
  }
  
  console.log('=== END TIMEZONE CONVERSION ===');
  return ranges;
};

// Simple UTC conversion for direct hour matching (fallback approach)
export const convertClientHourToUTC = (clientHour: number, timezoneOffset: number): number => {
  const utcHour = clientHour - timezoneOffset;
  if (utcHour < 0) return utcHour + 24;
  if (utcHour >= 24) return utcHour - 24;
  return utcHour;
};

export const getTimezoneConfig = (timezoneValue: string) => {
  return TIMEZONES.find(tz => tz.value === timezoneValue);
};
