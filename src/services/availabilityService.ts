import { supabase } from '@/integrations/supabase/client';
import { GranularTimeSlot } from '@/types/availability';
import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';
import { getTimezoneConfig } from '@/utils/timezoneUtils';

export class AvailabilityService {
  static async searchAvailableSlots(
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ): Promise<GranularTimeSlot[]> {
    console.log('=== PHASE 1: AVAILABILITY SERVICE FIX ===');
    console.log('Search Parameters:', { 
      selectedDate: date.toDateString(), 
      dateString: date.toISOString().split('T')[0],
      timezone, 
      teacherType, 
      selectedHour 
    });
    
    // PHASE 1 FIX: Use the exact selected date without any shifts
    const exactDateString = date.toISOString().split('T')[0];
    const timezoneConfig = getTimezoneConfig(timezone);
    
    if (!timezoneConfig) {
      throw new Error(`Invalid timezone: ${timezone}`);
    }
    
    console.log('PHASE 1: Using exact date for database search:', exactDateString);
    
    // PHASE 1 FIX: Convert only the time, preserve the date
    const timeConversion = this.convertClientTimeToServer(date, selectedHour, timezone);
    
    console.log('PHASE 1: Time conversion result:', timeConversion);
    
    // Build teacher type filter
    let teacherTypeFilter: string[];
    if (teacherType === 'mixed') {
      teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
    } else {
      teacherTypeFilter = [teacherType, 'mixed'];
    }
    
    // PHASE 1 FIX: Search using the EXACT selected date
    const slots = await this.searchUsingSecureRPC(
      exactDateString, // Use the exact selected date
      timeConversion.utcHour,
      teacherTypeFilter,
      selectedHour,
      timezoneConfig
    );
    
    console.log('PHASE 1: Final available slots for date', exactDateString, ':', slots.length);
    console.log('=== END PHASE 1 AVAILABILITY SERVICE ===');
    
    return slots;
  }

  // PHASE 1 FIX: Add dedicated time conversion method
  private static convertClientTimeToServer(clientDate: Date, clientHour: number, timezone: string) {
    const tzConfig = getTimezoneConfig(timezone);
    if (!tzConfig) {
      throw new Error(`Invalid timezone: ${timezone}`);
    }

    // Only convert the hour, preserve the date
    const utcHour = clientHour - tzConfig.offset;
    
    let adjustedUtcHour = utcHour;
    if (utcHour < 0) {
      adjustedUtcHour = utcHour + 24;
    } else if (utcHour >= 24) {
      adjustedUtcHour = utcHour - 24;
    }

    return {
      utcHour: adjustedUtcHour,
      utcTime: `${String(adjustedUtcHour).padStart(2, '0')}:00:00`
    };
  }

  private static async searchUsingSecureRPC(
    dateStr: string,
    baseUtcHour: number,
    teacherTypeFilter: string[],
    clientHour: number,
    timezoneConfig: any
  ): Promise<GranularTimeSlot[]> {
    console.log('--- PHASE 1: SECURE RPC SEARCH WITH DATE PRESERVATION ---');
    console.log('RPC Parameters:', { 
      exactDateString: dateStr, 
      baseUtcHour, 
      teacherTypeFilter, 
      clientHour 
    });
    
    // Create search window
    const searchStartHour = Math.max(0, baseUtcHour - 1);
    const searchEndHour = Math.min(24, baseUtcHour + 2);
    
    const startTime = `${String(searchStartHour).padStart(2, '0')}:00:00`;
    const endTime = `${String(searchEndHour).padStart(2, '0')}:00:00`;
    
    console.log('PHASE 1: UTC Time Range for database search:', { 
      dateString: dateStr,
      startTime, 
      endTime 
    });
    
    // PHASE 1 FIX: Call RPC with exact date string
    const { data: rpcResults, error: rpcError } = await supabase
      .rpc('search_available_teachers', {
        p_date: dateStr, // Use exact date string
        p_start_time: startTime,
        p_end_time: endTime,
        p_teacher_types: teacherTypeFilter
      });

    console.log('PHASE 1: RPC Results for date', dateStr, ':', { 
      resultsCount: rpcResults?.length || 0, 
      error: rpcError 
    });

    if (rpcError) {
      console.error('PHASE 1: RPC Error:', rpcError);
      return [];
    }

    if (!rpcResults || rpcResults.length === 0) {
      console.log('PHASE 1: No teachers found for exact date:', dateStr);
      return [];
    }

    // Process results
    const slots: GranularTimeSlot[] = [];
    
    for (const result of rpcResults) {
      const timeSlotStr = result.time_slot;
      const [slotHour, slotMinutes] = timeSlotStr.split(':').map(Number);

      // Generate display times
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

      slots.push(finalSlot);
    }

    console.log(`PHASE 1: Final slots for date ${dateStr}:`, slots.length);
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
