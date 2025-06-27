
import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// Egypt timezone constant - handles DST automatically
export const EGYPT_TIMEZONE = 'Africa/Cairo';

/**
 * Formats a UTC date/time to Egypt timezone display
 * Automatically handles DST transitions
 */
export const formatInEgyptTime = (
  utcDate: Date | string,
  formatStr: string = 'dd/MM/yyyy h:mm a'
): string => {
  if (!utcDate) return 'Not scheduled';
  
  try {
    let date: Date;
    
    if (typeof utcDate === 'string') {
      // Ensure UTC interpretation by adding 'Z' if missing
      const dateStr = utcDate.endsWith('Z') ? utcDate : `${utcDate}Z`;
      date = parseISO(dateStr);
    } else {
      date = utcDate;
    }
    
    // Convert to Egypt timezone (handles DST automatically)
    const egyptDate = toZonedTime(date, EGYPT_TIMEZONE);
    return format(egyptDate, formatStr);
  } catch (error) {
    console.error('Egypt timezone formatting error:', error);
    return 'Invalid date';
  }
};

/**
 * Formats date and time strings to Egypt timezone
 * Used for database date/time pairs
 */
export const formatDateTimeInEgyptTime = (
  date?: string,
  time?: string,
  formatStr: string = "dd/MM/yyyy 'at' h:mm a"
): string => {
  if (!date || !time) return 'Not scheduled';
  
  try {
    // Normalize time format (add seconds if missing)
    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    
    // Create UTC datetime string
    const utcDateTimeString = `${date}T${normalizedTime}`;
    
    return formatInEgyptTime(utcDateTimeString, formatStr);
  } catch (error) {
    console.error('Date/time formatting error:', error);
    return 'Date formatting error';
  }
};

/**
 * Formats time string for today in Egypt timezone
 * Used for time-only displays
 */
export const formatTimeInEgyptToday = (
  timeStr: string,
  formatStr: string = 'h:mm a'
): string => {
  if (!timeStr) return 'Invalid time';
  
  try {
    // Get current date in Egypt timezone
    const egyptNow = toZonedTime(new Date(), EGYPT_TIMEZONE);
    const todayInEgypt = format(egyptNow, 'yyyy-MM-dd');
    
    // Normalize time format
    const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    
    // Create datetime string and format in Egypt time
    const utcDateTimeString = `${todayInEgypt}T${normalizedTime}`;
    return formatInEgyptTime(utcDateTimeString, formatStr);
  } catch (error) {
    console.error('Time formatting error:', error);
    return timeStr;
  }
};

/**
 * Generic timezone formatter for multi-timezone displays
 * Used in sales dashboard to show both client and Egypt time
 */
export const formatInTimezone = (
  utcDate: Date | string,
  timeZone: string,
  formatStr: string = 'h:mm a'
): string => {
  if (!utcDate) return 'Invalid date';
  
  try {
    let date: Date;
    
    if (typeof utcDate === 'string') {
      const dateStr = utcDate.endsWith('Z') ? utcDate : `${utcDate}Z`;
      date = parseISO(dateStr);
    } else {
      date = utcDate;
    }
    
    const zonedDate = toZonedTime(date, timeZone);
    return format(zonedDate, formatStr);
  } catch (error) {
    console.error('Timezone conversion error:', error);
    return 'Invalid date';
  }
};

/**
 * Get current date/time in Egypt timezone
 * Useful for "today" calculations and current time displays
 */
export const getCurrentEgyptTime = (): Date => {
  return toZonedTime(new Date(), EGYPT_TIMEZONE);
};

/**
 * Check if it's currently DST in Egypt
 * For debugging purposes
 */
export const isEgyptDST = (): boolean => {
  const now = new Date();
  const egyptTime = toZonedTime(now, EGYPT_TIMEZONE);
  const utcTime = fromZonedTime(egyptTime, EGYPT_TIMEZONE);
  
  // Calculate offset difference
  const offsetDiff = (egyptTime.getTime() - utcTime.getTime()) / (1000 * 60 * 60);
  
  // DST is active if offset is +3, standard time is +2
  return Math.abs(offsetDiff - 3) < 0.1;
};
