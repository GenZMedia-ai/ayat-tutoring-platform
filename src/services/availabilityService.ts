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
    console.log('=== AVAILABILITY SERVICE START ===');
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
    
    // Query for slots within the hour range
    const slots = await this.findSlotsInHourRange(
      dateStr,
      utcHour,
      teacherType,
      selectedHour,
      timezoneConfig
    );
    
    console.log('Final available slots:', slots.length);
    console.log('=== AVAILABILITY SERVICE END ===');
    
    return slots;
  }

  private static async findSlotsInHourRange(
    dateStr: string,
    utcHour: number,
    teacherType: string,
    clientHour: number,
    timezoneConfig: any
  ): Promise<GranularTimeSlot[]> {
    console.log('--- HOUR RANGE SLOT SEARCH ---');
    console.log('Input Parameters:', { dateStr, utcHour, teacherType, clientHour });
    
    // Define the hour range in UTC - search the entire hour for 30-minute slots
    const startTime = `${String(utcHour).padStart(2, '0')}:00:00`;
    const endHour = (utcHour + 1) % 24;
    const endTime = `${String(endHour).padStart(2, '0')}:00:00`;
    
    console.log('UTC Time Range:', { startTime, endTime });
    
    // Step 1: Get all available slots in the time range
    console.log('Step 1: Querying available slots...');
    const { data: availability, error: availabilityError } = await supabase
      .from('teacher_availability')
      .select('id, time_slot, teacher_id')
      .eq('date', dateStr)
      .gte('time_slot', startTime)
      .lt('time_slot', endTime)
      .eq('is_available', true)
      .eq('is_booked', false);

    console.log('Available slots result:', { availability, error: availabilityError });

    if (availabilityError) {
      console.error('Error fetching availability:', availabilityError);
      return [];
    }

    if (!availability || availability.length === 0) {
      console.log('No available slots found in time range');
      return [];
    }

    // Step 2: Get unique teacher IDs from available slots
    const teacherIds = [...new Set(availability.map(slot => slot.teacher_id))];
    console.log('Teacher IDs from slots:', teacherIds);
    
    // Step 3: Build teacher type filter - FIXED TO USE CORRECT TEACHER TYPES
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
    
    // Step 4: Get teacher profiles with proper filtering
    console.log('Step 2: Querying teacher profiles...');
    const { data: teachers, error: teacherError } = await supabase
      .from('profiles')
      .select('id, full_name, teacher_type, status, role')
      .in('id', teacherIds)
      .in('teacher_type', teacherTypeFilter)
      .eq('status', 'approved')
      .eq('role', 'teacher');

    console.log('Teachers query result:', { 
      teachers, 
      error: teacherError,
      teacherCount: teachers?.length || 0 
    });

    if (teacherError) {
      console.error('Error fetching teachers:', teacherError);
      return [];
    }

    if (!teachers || teachers.length === 0) {
      console.log('No matching teachers found with criteria:', {
        teacherIds,
        teacherTypeFilter,
        status: 'approved',
        role: 'teacher'
      });
      return [];
    }

    // Step 5: Create teacher lookup map
    const teacherMap = new Map(teachers.map(teacher => [teacher.id, teacher]));
    console.log('Teacher Map created:', Array.from(teacherMap.keys()));

    // Step 6: Process slots and filter by available teachers
    console.log('Step 3: Processing and matching slots...');
    const slots: GranularTimeSlot[] = availability
      .filter(slot => {
        const hasTeacher = teacherMap.has(slot.teacher_id);
        if (!hasTeacher) {
          console.log(`Slot ${slot.time_slot} excluded - teacher ${slot.teacher_id} not in map`);
        }
        return hasTeacher;
      })
      .map(slot => {
        const [slotHour, slotMinutes] = slot.time_slot.split(':').map(Number);
        const teacher = teacherMap.get(slot.teacher_id)!;

        console.log('Processing slot:', { 
          slotTime: slot.time_slot, 
          teacherId: slot.teacher_id,
          teacherName: teacher.full_name,
          teacherType: teacher.teacher_type 
        });

        // Generate display times for this specific slot
        const displayInfo = this.generateSlotDisplay(
          slotHour,
          slotMinutes,
          clientHour,
          timezoneConfig.offset
        );

        const finalSlot = {
          id: slot.id,
          startTime: displayInfo.startTime,
          endTime: displayInfo.endTime,
          clientTimeDisplay: displayInfo.clientDisplay,
          egyptTimeDisplay: displayInfo.egyptDisplay,
          utcStartTime: slot.time_slot,
          utcEndTime: displayInfo.utcEndTime,
          teacherId: teacher.id,
          teacherName: teacher.full_name || 'Unnamed Teacher',
          teacherType: teacher.teacher_type,
          isBooked: false
        };

        console.log('Generated slot:', finalSlot);
        return finalSlot;
      });

    console.log(`Final result: ${slots.length} slots generated`);
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
