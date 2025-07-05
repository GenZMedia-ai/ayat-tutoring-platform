/**
 * Centralized Time Utilities for Consistent Time Format Handling
 * Prevents future time format errors and ensures consistent behavior
 */

/**
 * Convert any time format to database-compatible HH:MM:SS format
 * Handles: 12-hour (4:00 PM), 24-hour (16:00), and already formatted (16:00:00)
 */
export const formatTimeForDB = (time: string): string => {
  if (!time) {
    throw new Error('Time is required');
  }
  
  // Handle 12-hour format (e.g., "4:00 PM", "12:30 AM")
  if (time.includes('AM') || time.includes('PM')) {
    const [timePart, period] = time.split(' ');
    const [hours, minutes] = timePart.split(':');
    let hour24 = parseInt(hours);
    
    // Convert to 24-hour format
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
  }
  
  // If time is already in HH:MM:SS format, return as is
  if (time.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
    const [hours, minutes, seconds] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes}:${seconds}`;
  }
  
  // If time is in HH:MM format, add :00 seconds
  if (time.match(/^\d{1,2}:\d{2}$/)) {
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  }
  
  throw new Error(`Invalid time format: ${time}. Expected HH:MM, HH:MM:SS, or 12-hour format (e.g., 4:00 PM)`);
};

/**
 * Convert 24-hour format to 12-hour format for display
 */
export const formatTimeForDisplay = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minutes} ${period}`;
};

/**
 * Validate time format
 */
export const isValidTimeFormat = (time: string): boolean => {
  if (!time) return false;
  
  // Check 12-hour format
  if (time.match(/^\d{1,2}:\d{2}\s?(AM|PM)$/i)) return true;
  
  // Check 24-hour format
  if (time.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const m = parseInt(minutes);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }
  
  return false;
};

/**
 * Get time in both formats for UI components
 */
export const getTimeFormats = (time: string): { time12: string; time24: string; dbFormat: string } => {
  const dbFormat = formatTimeForDB(time);
  const [hours, minutes] = dbFormat.split(':');
  const time24 = `${hours}:${minutes}`;
  const time12 = formatTimeForDisplay(time24);
  
  return { time12, time24, dbFormat };
};

/**
 * TypeScript types for time handling
 */
export type TimeFormat12 = string; // e.g., "4:00 PM"
export type TimeFormat24 = string; // e.g., "16:00"
export type TimeFormatDB = string;  // e.g., "16:00:00"

export interface TimeSlotData {
  time12: TimeFormat12;
  time24: TimeFormat24;
  dbFormat: TimeFormatDB;
}