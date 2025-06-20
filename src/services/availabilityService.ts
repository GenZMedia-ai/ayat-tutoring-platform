
import { supabase } from '@/integrations/supabase/client';
import { GranularTimeSlot } from '@/types/availability';
import { convertClientHourToUTC, getTimezoneConfig } from '@/utils/timezoneUtils';

export class AvailabilityService {
  static async searchAvailableSlots(
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ): Promise<GranularTimeSlot[]> {
    console.log('=== AVAILABILITY SERVICE START (Using Secure RPC) ===');
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
    
    // Convert client hour to UTC
    const utcHour = convertClientHourToUTC(selectedHour, timezoneConfig.offset);
    console.log('Converted UTC Hour:', utcHour);
    
    // Build teacher type filter - FIXED TO USE CORRECT TEACHER TYPES
    let teacherTypeFilter: string[];
    if (teacherType === 'mixed') {
      // When searching for 'mixed', include all teacher types since mixed teachers can handle any type
      teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
      console.log('Searching for mixed teachers - including all types');
    } else {
      // When searching for specific type, include that type + mixed teachers
      teacherTypeFilter = [teacherType, 'mixed'];
      console.log(`Searching for ${teacherType} teachers - including mixed`);
    }
    
    console.log('Teacher Type Filter:', teacherTypeFilter);
    
    // Use the secure RPC function to get available teachers
    const slots = await this.searchUsingSecureRPC(
      dateStr,
      utcHour,
      teacherTypeFilter,
      selectedHour,
      timezoneConfig
    );
    
    console.log('Final available slots:', slots.length);
    console.log('=== AVAILABILITY SERVICE END ===');
    
    return slots;
  }

  private static async searchUsingSecureRPC(
    dateStr: string,
    utcHour: number,
    teacherTypeFilter: string[],
    clientHour: number,
    timezoneConfig: any
  ): Promise<GranularTimeSlot[]> {
    console.log('--- SECURE RPC SEARCH ---');
    console.log('RPC Parameters:', { dateStr, utcHour, teacherTypeFilter, clientHour });
    
    // Define the hour range in UTC - search the entire hour for 30-minute slots
    const startTime = `${String(utcHour).padStart(2, '0')}:00:00`;
    const endHour = (utcHour + 1) % 24;
    const endTime = `${String(endHour).padStart(2, '0')}:00:00`;
    
    console.log('UTC Time Range for RPC:', { startTime, endTime });
    
    // Call the secure RPC function
    const { data: rpcResults, error: rpcError } = await supabase
      .rpc('search_available_teachers', {
        p_date: dateStr,
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

    // Process RPC results into GranularTimeSlot format
    const slots: GranularTimeSlot[] = rpcResults.map((result: any) => {
      const timeSlotStr = result.time_slot;
      const [slotHour, slotMinutes] = timeSlotStr.split(':').map(Number);

      console.log('Processing RPC result:', { 
        timeSlot: timeSlotStr, 
        teacherId: result.teacher_id,
        teacherName: result.teacher_name,
        teacherType: result.teacher_type 
      });

      // Generate display times for this specific slot
      const displayInfo = this.generateSlotDisplay(
        slotHour,
        slotMinutes,
        clientHour,
        timezoneConfig.offset
      );

      const finalSlot = {
        id: result.availability_id,
        startTime: displayInfo.startTime,
        endTime: displayInfo.endTime,
        clientTimeDisplay: displayInfo.clientDisplay,
        egyptTimeDisplay: displayInfo.egyptDisplay,
        utcStartTime: `${timeSlotStr}:00`,
        utcEndTime: displayInfo.utcEndTime,
        teacherId: result.teacher_id,
        teacherName: result.teacher_name || 'Unnamed Teacher',
        teacherType: result.teacher_type,
        isBooked: false
      };

      console.log('Generated slot from RPC:', finalSlot);
      return finalSlot;
    });

    console.log(`Final result: ${slots.length} slots generated from secure RPC`);
    return slots;
  }

  private static generateSlotDisplay(
    utcHour: number,
    utcMinutes: number,
    clientHour: number,
    timezoneOffset: number
  ) {
    // Calculate end time (30 minutes later)
    let endMinutes = utcMinutes + 30;
    let endHour = utcHour;

    if (endMinutes >= 60) {
      endMinutes = 0;
      endHour = (utcHour + 1) % 24;
    }

    // Format times
    const formatTime = (hour: number, min: number) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${String(min).padStart(2, '0')} ${period}`;
    };

    // Client timezone display
    const clientStartMinutes = utcMinutes;
    const clientEndMinutes = endMinutes;
    const clientEndHour = clientStartMinutes + 30 >= 60 ? clientHour + 1 : clientHour;

    // Egypt time (UTC+2)
    const egyptOffset = 2;
    const egyptHour = (utcHour + egyptOffset + 24) % 24;
    const egyptEndHour = (endHour + egyptOffset + 24) % 24;

    return {
      startTime: `${String(utcHour).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`,
      endTime: `${String(endHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`,
      utcEndTime: `${String(endHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`,
      clientDisplay: `${formatTime(clientHour, clientStartMinutes)}-${formatTime(clientEndHour, clientEndMinutes)}`,
      egyptDisplay: `${formatTime(egyptHour, utcMinutes)}-${formatTime(egyptEndHour, endMinutes)} (Egypt)`
    };
  }
}
