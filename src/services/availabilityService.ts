
import { supabase } from '@/integrations/supabase/client';
import { GranularTimeSlot } from '@/types/availability';
import { toZonedTime, format } from 'date-fns-tz';
import { getTimezoneConfig, convertClientHourToUTCPreservingDate } from '@/utils/timezoneUtils';

export class AvailabilityService {
  static async searchAvailableSlots(
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ): Promise<GranularTimeSlot[]> {
    console.log('=== AVAILABILITY SERVICE START (Fixed Date Preservation) ===');
    console.log('Search Parameters:', { 
      date: date.toDateString(), 
      dateStr: date.toISOString().split('T')[0],
      timezone, 
      teacherType, 
      selectedHour 
    });
    
    const dateStr = date.toISOString().split('T')[0];
    const timezoneConfig = getTimezoneConfig(timezone);
    
    if (!timezoneConfig) {
      throw new Error(`Invalid timezone: ${timezone}`);
    }
    
    console.log('Timezone Config:', timezoneConfig);
    
    // FIXED: Use date-preserving conversion
    const conversion = convertClientHourToUTCPreservingDate(selectedHour, date, timezone);
    const utcHour = conversion.utcHour;
    const utcMinutes = conversion.utcMinutes;
    
    console.log('Fixed timezone conversion (date preserved):', { 
      originalDate: dateStr,
      searchDate: conversion.utcDateString,
      clientHour: selectedHour,
      utcHour,
      utcMinutes,
      datePreserved: dateStr === conversion.utcDateString
    });
    
    // Build teacher type filter
    let teacherTypeFilter: string[];
    if (teacherType === 'mixed') {
      teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
      console.log('Searching for mixed teachers - including all types');
    } else {
      teacherTypeFilter = [teacherType, 'mixed'];
      console.log(`Searching for ${teacherType} teachers - including mixed`);
    }
    
    console.log('Teacher Type Filter:', teacherTypeFilter);
    
    // FIXED: Search using the preserved date
    const slots = await this.searchUsingSecureRPC(
      conversion.utcDateString, // Use preserved date string
      utcHour,
      teacherTypeFilter,
      selectedHour,
      timezoneConfig
    );
    
    console.log('Final available slots:', slots.length);
    console.log('=== AVAILABILITY SERVICE END (Date Preserved) ===');
    
    return slots;
  }

  private static async searchUsingSecureRPC(
    dateStr: string,
    baseUtcHour: number,
    teacherTypeFilter: string[],
    clientHour: number,
    timezoneConfig: any
  ): Promise<GranularTimeSlot[]> {
    console.log('--- SECURE RPC SEARCH (Fixed Date Handling) ---');
    console.log('RPC Parameters:', { dateStr, baseUtcHour, teacherTypeFilter, clientHour });
    
    // Create a wider search window to catch all 30-minute slots
    // Search from 1 hour before to 2 hours after to ensure we get all relevant slots
    const searchStartHour = Math.max(0, baseUtcHour - 1);
    const searchEndHour = Math.min(24, baseUtcHour + 2);
    
    const startTime = `${String(searchStartHour).padStart(2, '0')}:00:00`;
    const endTime = `${String(searchEndHour).padStart(2, '0')}:00:00`;
    
    console.log('Fixed UTC Time Range for RPC:', { startTime, endTime, searchDate: dateStr });
    
    // Call the secure RPC function with the FIXED date
    const { data: rpcResults, error: rpcError } = await supabase
      .rpc('search_available_teachers', {
        p_date: dateStr, // FIXED: Use preserved date
        p_start_time: startTime,
        p_end_time: endTime,
        p_teacher_types: teacherTypeFilter
      });

    console.log('RPC Results:', { rpcResults, error: rpcError });

    if (rpcError) {
      console.error('Error calling secure RPC function:', rpcError);
      return [];
    }

    if (!rpcResults || rpcResults.length === 0) {
      console.log('No teachers found via secure RPC');
      return [];
    }

    console.log(`RPC returned ${rpcResults.length} teacher-slot combinations`);

    // Filter and process RPC results into GranularTimeSlot format
    const slots: GranularTimeSlot[] = [];
    
    for (const result of rpcResults) {
      const timeSlotStr = result.time_slot;
      const [slotHour, slotMinutes] = timeSlotStr.split(':').map(Number);

      console.log('Processing RPC result:', { 
        timeSlot: timeSlotStr, 
        teacherId: result.teacher_id,
        teacherName: result.teacher_name,
        teacherType: result.teacher_type 
      });

      // Generate display times for this specific slot using date-fns-tz
      const displayInfo = this.generateSlotDisplayWithDateFns(
        slotHour,
        slotMinutes,
        timezoneConfig,
        dateStr
      );

      const finalSlot = {
        id: result.availability_id,
        startTime: displayInfo.startTime,
        endTime: displayInfo.endTime,
        clientTimeDisplay: displayInfo.clientDisplay,
        egyptTimeDisplay: displayInfo.egyptDisplay,
        utcStartTime: timeSlotStr,
        utcEndTime: displayInfo.utcEndTime,
        teacherId: result.teacher_id,
        teacherName: result.teacher_name || 'Unnamed Teacher',
        teacherType: result.teacher_type,
        isBooked: false
      };

      console.log('Generated slot from RPC:', finalSlot);
      slots.push(finalSlot);
    }

    console.log(`Final result: ${slots.length} slots generated from secure RPC`);
    return slots;
  }

  private static generateSlotDisplayWithDateFns(
    utcHour: number,
    utcMinutes: number,
    timezoneConfig: any,
    dateStr: string
  ) {
    // Create UTC date for the slot
    const utcSlotDate = new Date(`${dateStr}T${String(utcHour).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}:00.000Z`);
    
    // Calculate end time (30 minutes later)
    const utcEndDate = new Date(utcSlotDate.getTime() + 30 * 60 * 1000);

    // Format times using date-fns-tz for accurate timezone conversion
    const formatTime = (date: Date, timeZone: string) => {
      const zonedDate = toZonedTime(date, timeZone);
      const hour = zonedDate.getHours();
      const minutes = zonedDate.getMinutes();
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
    };

    // Client timezone display
    const clientStartTime = formatTime(utcSlotDate, timezoneConfig.iana);
    const clientEndTime = formatTime(utcEndDate, timezoneConfig.iana);

    // Egypt time (Africa/Cairo)
    const egyptStartTime = formatTime(utcSlotDate, 'Africa/Cairo');
    const egyptEndTime = formatTime(utcEndDate, 'Africa/Cairo');

    return {
      startTime: `${String(utcHour).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`,
      endTime: format(utcEndDate, 'HH:mm', { timeZone: 'UTC' }),
      utcEndTime: format(utcEndDate, 'HH:mm:ss', { timeZone: 'UTC' }),
      clientDisplay: `${clientStartTime}-${clientEndTime}`,
      egyptDisplay: `${egyptStartTime}-${egyptEndTime} (Egypt)`
    };
  }
}
