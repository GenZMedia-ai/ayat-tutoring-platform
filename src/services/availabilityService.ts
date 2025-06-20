
import { supabase } from '@/integrations/supabase/client';
import { GranularTimeSlot } from '@/types/availability';
import { convertClientHourToUTC, generateDisplaySlots, getTimezoneConfig } from '@/utils/timezoneUtils';

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
    const targetTimeSlot = `${String(utcHour).padStart(2, '0')}:00:00`;
    
    console.log('Target UTC Time Slot:', targetTimeSlot);
    
    // Primary query: Find exact UTC hour match
    const availableSlots = await this.findExactTimeSlots(
      dateStr, 
      targetTimeSlot, 
      teacherType, 
      selectedHour, 
      timezoneConfig.offset
    );
    
    if (availableSlots.length > 0) {
      console.log('Found slots with exact time match:', availableSlots.length);
      return availableSlots;
    }
    
    // Fallback: Broader time search
    console.log('No exact matches, trying broader search...');
    const fallbackSlots = await this.findNearbyTimeSlots(
      dateStr, 
      utcHour, 
      teacherType, 
      selectedHour, 
      timezoneConfig.offset
    );
    
    console.log('Final available slots:', fallbackSlots.length);
    console.log('=== AVAILABILITY SERVICE END ===');
    
    return fallbackSlots;
  }
  
  private static async findExactTimeSlots(
    dateStr: string,
    targetTimeSlot: string,
    teacherType: string,
    selectedHour: number,
    timezoneOffset: number
  ): Promise<GranularTimeSlot[]> {
    console.log('--- EXACT TIME SLOT SEARCH ---');
    console.log('Searching for time slot:', targetTimeSlot);
    
    // Query for exact time slot availability
    const { data: availability, error: availabilityError } = await supabase
      .from('teacher_availability')
      .select('id, teacher_id, time_slot, is_available, is_booked')
      .eq('date', dateStr)
      .eq('time_slot', targetTimeSlot)
      .eq('is_available', true)
      .eq('is_booked', false);
    
    console.log('Raw availability query result:', availability);
    console.log('Availability error:', availabilityError);
    
    if (availabilityError || !availability || availability.length === 0) {
      console.log('No availability found for exact time slot');
      return [];
    }
    
    // Get qualified teachers (include mixed teachers for any request)
    const teacherIds = Array.from(new Set(availability.map(a => a.teacher_id)));
    console.log('Teacher IDs from availability:', teacherIds);
    
    const qualifiedTeachers = await this.getQualifiedTeachers(teacherIds, teacherType);
    console.log('Qualified teachers:', qualifiedTeachers);
    
    if (!qualifiedTeachers || qualifiedTeachers.length === 0) {
      console.log('No qualified teachers found');
      return [];
    }
    
    // Generate display slots for qualified teachers
    const displaySlots = generateDisplaySlots(selectedHour, timezoneOffset);
    const slots: GranularTimeSlot[] = [];
    
    qualifiedTeachers.forEach((teacher) => {
      const teacherAvailability = availability.find(a => a.teacher_id === teacher.id);
      if (teacherAvailability) {
        displaySlots.forEach((displaySlot, index) => {
          slots.push({
            id: `${teacherAvailability.id}-${index}`,
            startTime: displaySlot.utcStartTime.substring(0, 5),
            endTime: displaySlot.utcEndTime.substring(0, 5),
            clientTimeDisplay: displaySlot.clientDisplay,
            egyptTimeDisplay: displaySlot.egyptDisplay,
            utcStartTime: displaySlot.utcStartTime,
            utcEndTime: displaySlot.utcEndTime,
            teacherId: teacher.id,
            teacherName: teacher.full_name || 'Unnamed Teacher',
            teacherType: teacher.teacher_type,
            isBooked: teacherAvailability.is_booked || false
          });
        });
      }
    });
    
    console.log('Generated slots:', slots);
    return slots;
  }
  
  private static async findNearbyTimeSlots(
    dateStr: string,
    targetUtcHour: number,
    teacherType: string,
    selectedHour: number,
    timezoneOffset: number
  ): Promise<GranularTimeSlot[]> {
    console.log('--- NEARBY TIME SLOTS SEARCH ---');
    
    // Search 1 hour before and after the target time
    const searchHours = [targetUtcHour - 1, targetUtcHour, targetUtcHour + 1].map(h => {
      if (h < 0) return h + 24;
      if (h >= 24) return h - 24;
      return h;
    });
    
    const timeSlots = searchHours.map(h => `${String(h).padStart(2, '0')}:00:00`);
    console.log('Searching time slots:', timeSlots);
    
    const { data: availability, error } = await supabase
      .from('teacher_availability')
      .select('id, teacher_id, time_slot, is_available, is_booked')
      .eq('date', dateStr)
      .in('time_slot', timeSlots)
      .eq('is_available', true)
      .eq('is_booked', false);
    
    console.log('Nearby availability:', availability);
    
    if (!availability || availability.length === 0) {
      return [];
    }
    
    const teacherIds = Array.from(new Set(availability.map(a => a.teacher_id)));
    const qualifiedTeachers = await this.getQualifiedTeachers(teacherIds, teacherType);
    
    // Return results for any available time
    const slots: GranularTimeSlot[] = [];
    const displaySlots = generateDisplaySlots(selectedHour, timezoneOffset);
    
    qualifiedTeachers?.forEach((teacher) => {
      const teacherAvailability = availability.find(a => a.teacher_id === teacher.id);
      if (teacherAvailability) {
        displaySlots.forEach((displaySlot, index) => {
          slots.push({
            id: `${teacherAvailability.id}-nearby-${index}`,
            startTime: displaySlot.utcStartTime.substring(0, 5),
            endTime: displaySlot.utcEndTime.substring(0, 5),
            clientTimeDisplay: displaySlot.clientDisplay,
            egyptTimeDisplay: displaySlot.egyptDisplay,
            utcStartTime: displaySlot.utcStartTime,
            utcEndTime: displaySlot.utcEndTime,
            teacherId: teacher.id,
            teacherName: teacher.full_name || 'Unnamed Teacher',
            teacherType: teacher.teacher_type,
            isBooked: teacherAvailability.is_booked || false
          });
        });
      }
    });
    
    return slots;
  }
  
  private static async getQualifiedTeachers(teacherIds: string[], teacherType: string) {
    console.log('--- TEACHER QUALIFICATION CHECK ---');
    console.log(`Checking teachers: ${teacherIds} for type: ${teacherType}`);
    
    // Simple query: Always include mixed teachers, plus specific type if requested
    let query = supabase
      .from('profiles')
      .select('id, full_name, teacher_type, status, role')
      .in('id', teacherIds)
      .eq('status', 'approved')
      .eq('role', 'teacher');
    
    // Always include mixed teachers, plus the requested type
    if (teacherType === 'mixed') {
      query = query.eq('teacher_type', 'mixed');
    } else {
      query = query.or(`teacher_type.eq.${teacherType},teacher_type.eq.mixed`);
    }
    
    const { data: teachers, error: teachersError } = await query;
    
    console.log('Teacher query result:', teachers);
    console.log('Teacher query error:', teachersError);
    
    if (teachersError) {
      console.error('Teachers query error:', teachersError);
      return [];
    }
    
    return teachers || [];
  }
}
