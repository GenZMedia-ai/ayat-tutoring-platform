
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
    
    // Define the hour range in UTC
    const startTime = `${String(utcHour).padStart(2, '0')}:00:00`;
    const endHour = (utcHour + 1) % 24;
    const endTime = `${String(endHour).padStart(2, '0')}:00:00`;
    
    console.log('UTC Time Range:', { startTime, endTime });
    
    // Build teacher type filter
    const teacherTypeFilter = teacherType === 'mixed'
      ? 'teacher_type.eq.mixed'
      : `teacher_type.in.(${teacherType},mixed)`;
    
    console.log('Teacher Type Filter:', teacherTypeFilter);
    
    // Query with joined teacher profiles for efficiency
    const { data: availability, error } = await supabase
      .from('teacher_availability')
      .select(`
        id,
        time_slot,
        is_available,
        is_booked,
        teacher_id,
        profiles!inner(
          id,
          full_name,
          teacher_type,
          status,
          role
        )
      `)
      .eq('date', dateStr)
      .gte('time_slot', startTime)
      .lt('time_slot', endTime)
      .eq('is_available', true)
      .eq('is_booked', false)
      .eq('profiles.status', 'approved')
      .eq('profiles.role', 'teacher')
      .or(teacherTypeFilter, { foreignTable: 'profiles' });

    console.log('Query Result:', { availability, error });

    if (error || !availability || availability.length === 0) {
      console.log('No availability found');
      return [];
    }

    // Process each slot individually - one database slot = one display slot
    const slots: GranularTimeSlot[] = availability.map(slot => {
      const [slotHour, slotMinutes] = slot.time_slot.split(':').map(Number);
      const teacher = slot.profiles;

      console.log('Processing slot:', { 
        slotTime: slot.time_slot, 
        teacher: teacher.full_name,
        teacherType: teacher.teacher_type 
      });

      // Generate display times for this specific slot
      const displayInfo = this.generateSlotDisplay(
        slotHour,
        slotMinutes,
        clientHour,
        timezoneConfig.offset
      );

      return {
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
    });

    console.log('Generated slots:', slots);
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
