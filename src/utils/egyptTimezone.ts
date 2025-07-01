
import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export const EGYPT_TIMEZONE = 'Africa/Cairo';

/**
 * Generic timezone converter - handles DST automatically using IANA timezone identifiers
 * NO hardcoded offsets - relies on date-fns-tz for accurate timezone conversion
 */
export const formatInTimezone = (
  utcDate: Date | string,
  timeZone: string,
  formatStr: string = 'h:mm a'
): string => {
  try {
    // Ensure UTC parsing - critical for correct conversion
    let date: Date;
    if (typeof utcDate === 'string') {
      // Add 'Z' if missing to ensure UTC interpretation
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
 * Egypt-specific formatter for dashboards - automatically handles DST
 * Use this for all Teacher/Sales dashboard time displays
 */
export const formatInEgyptTime = (
  utcDate: Date | string,
  formatStr: string = 'dd/MM/yyyy h:mm a'
): string => {
  return formatInTimezone(utcDate, EGYPT_TIMEZONE, formatStr);
};

/**
 * For time-only displays (assumes today in Egypt timezone)
 * Handles current Egypt time including DST automatically
 */
export const formatTimeInEgyptToday = (
  timeStr: string,
  formatStr: string = 'h:mm a'
): string => {
  try {
    const egyptNow = toZonedTime(new Date(), EGYPT_TIMEZONE);
    const todayInEgypt = format(egyptNow, 'yyyy-MM-dd');
    const utcDateTime = parseISO(`${todayInEgypt}T${timeStr}Z`);
    return formatInTimezone(utcDateTime, EGYPT_TIMEZONE, formatStr);
  } catch (error) {
    console.error('Time formatting error:', error);
    return timeStr;
  }
};

/**
 * Convert Egypt time to UTC for database storage
 * Use this ONLY for Availability Management - preserves existing functionality
 * FIXED: Now uses formatInTimeZone to ensure proper UTC formatting
 */
export const convertEgyptTimeToUTC = (
  egyptTime24: string,
  date: Date
): string => {
  try {
    console.log('🇪🇬 Converting Egypt time to UTC:', { egyptTime24, date: date.toDateString() });
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const egyptDateTimeString = `${dateStr}T${egyptTime24}:00`;
    
    // Convert FROM Egypt timezone TO UTC using fromZonedTime
    const utcDate = fromZonedTime(egyptDateTimeString, EGYPT_TIMEZONE);
    
    // FIXED: Use formatInTimeZone to ensure proper UTC formatting
    const utcTime = formatInTimeZone(utcDate, 'UTC', 'HH:mm:ss');
    
    console.log('✅ Egypt to UTC conversion result:', {
      egyptTime: egyptTime24,
      egyptDateTime: egyptDateTimeString,
      utcTime,
      utcDate: utcDate.toISOString()
    });
    
    return utcTime;
  } catch (error) {
    console.error('❌ Egypt to UTC conversion error:', error);
    return '00:00:00';
  }
};

/**
 * Format combined date and time for dashboard displays
 * Handles both date and time strings from database
 */
export const formatDateTimeInEgypt = (
  date?: string,
  time?: string,
  formatStr: string = "dd/MM/yyyy 'at' h:mm a"
): string => {
  if (!date || !time) return 'Not scheduled';
  
  try {
    // Normalize time format
    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    const utcDateTimeString = `${date}T${normalizedTime}`;
    
    return formatInEgyptTime(utcDateTimeString, formatStr);
  } catch (error) {
    console.error('❌ Date/time formatting error:', error);
    return 'Invalid date/time';
  }
};
