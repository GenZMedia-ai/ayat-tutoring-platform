
import { supabase } from '@/integrations/supabase/client';
import { GranularTimeSlot } from '@/types/availability';
import { convertClientHourToUTCRanges, convertClientHourToUTC, getTimezoneConfig } from '@/utils/timezoneUtils';

export class AvailabilityService {
  static async searchAvailableSlots(
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ): Promise<GranularTimeSlot[]> {
    console.log('=== AVAILABILITY SERVICE DEBUG ===');
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
    
    // First, let's check what availability data exists in the database
    const { data: allAvailability, error: allAvailabilityError } = await supabase
      .from('teacher_availability')
      .select('*')
      .eq('date', dateStr);
    
    console.log('All availability for date:', allAvailability);
    if (allAvailabilityError) {
      console.error('Error fetching all availability:', allAvailabilityError);
    }
    
    // Check what teachers exist
    const { data: allTeachers, error: teachersError } = await supabase
      .from('profiles')
      .select('id, full_name, teacher_type, status, role')
      .eq('role', 'teacher')
      .eq('status', 'approved');
    
    console.log('All approved teachers:', allTeachers);
    if (teachersError) {
      console.error('Error fetching teachers:', teachersError);
    }
    
    // Method 1: Try granular 30-minute slots
    const timeRanges = convertClientHourToUTCRanges(selectedHour, timezoneConfig.offset);
    console.log('Generated time ranges:', timeRanges);
    
    let availableSlots: GranularTimeSlot[] = [];
    
    // Try granular approach first
    for (let i = 0; i < timeRanges.length; i++) {
      const range = timeRanges[i];
      console.log(`\n--- Querying Slot ${i + 1}: ${range.utcStartTime} - ${range.utcEndTime} ---`);
      
      const slots = await this.findSlotsInRange(range, dateStr, teacherType, i);
      availableSlots.push(...slots);
    }
    
    // Method 2: If no slots found, try direct hour matching (fallback)
    if (availableSlots.length === 0) {
      console.log('\n--- FALLBACK: Trying direct hour matching ---');
      const utcHour = convertClientHourToUTC(selectedHour, timezoneConfig.offset);
      const hourTimeSlot = `${String(utcHour).padStart(2, '0')}:00:00`;
      
      console.log(`Searching for exact time slot: ${hourTimeSlot}`);
      
      const { data: hourAvailability, error: hourError } = await supabase
        .from('teacher_availability')
        .select('id, teacher_id, time_slot, is_available, is_booked')
        .eq('date', dateStr)
        .eq('time_slot', hourTimeSlot)
        .eq('is_available', true)
        .eq('is_booked', false);
      
      console.log('Direct hour availability:', hourAvailability);
      
      if (hourAvailability && hourAvailability.length > 0) {
        const teacherIds = Array.from(new Set(hourAvailability.map(a => a.teacher_id)));
        const qualifiedTeachers = await this.getQualifiedTeachers(teacherIds, teacherType);
        
        console.log('Qualified teachers for direct hour:', qualifiedTeachers);
        
        if (qualifiedTeachers && qualifiedTeachers.length > 0) {
          qualifiedTeachers.forEach((teacher) => {
            const teacherAvailability = hourAvailability.find(a => a.teacher_id === teacher.id);
            if (teacherAvailability) {
              // Create both 30-minute slots for the hour
              for (let minutes = 0; minutes < 60; minutes += 30) {
                const range = timeRanges[minutes / 30];
                availableSlots.push({
                  id: `${teacherAvailability.id}-${minutes/30}`,
                  startTime: range.utcStartTime.substring(0, 5),
                  endTime: range.utcEndTime.substring(0, 5),
                  clientTimeDisplay: range.clientDisplay,
                  egyptTimeDisplay: range.egyptDisplay,
                  utcStartTime: range.utcStartTime,
                  utcEndTime: range.utcEndTime,
                  teacherId: teacher.id,
                  teacherName: teacher.full_name || 'Unnamed Teacher',
                  teacherType: teacher.teacher_type,
                  isBooked: teacherAvailability.is_booked || false
                });
              }
            }
          });
        }
      }
    }
    
    // Method 3: If still no slots, try broader search
    if (availableSlots.length === 0) {
      console.log('\n--- FALLBACK 2: Trying broader time search ---');
      availableSlots = await this.broadTimeSearch(dateStr, teacherType, selectedHour, timezoneConfig.offset);
    }
    
    console.log('Final available slots:', availableSlots);
    console.log('=== END AVAILABILITY SERVICE ===');
    
    return availableSlots;
  }
  
  private static async findSlotsInRange(
    range: any, 
    dateStr: string, 
    teacherType: string, 
    slotIndex: number
  ): Promise<GranularTimeSlot[]> {
    // Query for availability in this specific 30-minute window
    const { data: availability, error: availabilityError } = await supabase
      .from('teacher_availability')
      .select('id, teacher_id, time_slot, is_available, is_booked')
      .eq('date', dateStr)
      .gte('time_slot', range.utcStartTime)
      .lt('time_slot', range.utcEndTime)
      .eq('is_available', true)
      .eq('is_booked', false);
    
    console.log(`Raw availability data for slot ${slotIndex + 1}:`, availability);
    
    if (availabilityError) {
      console.error('Availability query error:', availabilityError);
      return [];
    }
    
    if (!availability || availability.length === 0) {
      console.log(`No availability found for slot ${slotIndex + 1}`);
      return [];
    }
    
    const teacherIds = Array.from(new Set(availability.map(a => a.teacher_id)));
    const qualifiedTeachers = await this.getQualifiedTeachers(teacherIds, teacherType);
    
    const slots: GranularTimeSlot[] = [];
    
    if (qualifiedTeachers && qualifiedTeachers.length > 0) {
      qualifiedTeachers.forEach((teacher) => {
        const teacherAvailability = availability.find(a => a.teacher_id === teacher.id);
        if (teacherAvailability) {
          slots.push({
            id: `${teacherAvailability.id}-${slotIndex}`,
            startTime: range.utcStartTime.substring(0, 5),
            endTime: range.utcEndTime.substring(0, 5),
            clientTimeDisplay: range.clientDisplay,
            egyptTimeDisplay: range.egyptDisplay,
            utcStartTime: range.utcStartTime,
            utcEndTime: range.utcEndTime,
            teacherId: teacher.id,
            teacherName: teacher.full_name || 'Unnamed Teacher',
            teacherType: teacher.teacher_type,
            isBooked: teacherAvailability.is_booked || false
          });
        }
      });
    }
    
    return slots;
  }
  
  private static async getQualifiedTeachers(teacherIds: string[], teacherType: string) {
    console.log(`Searching for teachers with IDs: ${teacherIds} and type: ${teacherType}`);
    
    let teacherQuery = supabase
      .from('profiles')
      .select('id, full_name, teacher_type, status, role')
      .in('id', teacherIds)
      .eq('status', 'approved')
      .eq('role', 'teacher');
    
    // Enhanced teacher type filtering logic
    if (teacherType === 'mixed') {
      // If looking for mixed, only get mixed teachers
      teacherQuery = teacherQuery.eq('teacher_type', 'mixed');
    } else {
      // If looking for specific type, get that type OR mixed (since mixed can handle any type)
      teacherQuery = teacherQuery.or(`teacher_type.eq.${teacherType},teacher_type.eq.mixed`);
    }
    
    const { data: teachers, error: teachersError } = await teacherQuery;
    
    if (teachersError) {
      console.error('Teachers query error:', teachersError);
      return [];
    }
    
    console.log(`Qualified teachers found:`, teachers);
    return teachers || [];
  }
  
  private static async broadTimeSearch(
    dateStr: string, 
    teacherType: string, 
    selectedHour: number, 
    timezoneOffset: number
  ): Promise<GranularTimeSlot[]> {
    // Search for any availability around the target time
    const utcHour = convertClientHourToUTC(selectedHour, timezoneOffset);
    const searchHours = [utcHour - 1, utcHour, utcHour + 1].map(h => {
      if (h < 0) return h + 24;
      if (h >= 24) return h - 24;
      return h;
    });
    
    console.log(`Broad search for hours: ${searchHours.map(h => `${h}:00:00`).join(', ')}`);
    
    const timeSlots = searchHours.map(h => `${String(h).padStart(2, '0')}:00:00`);
    
    const { data: availability, error } = await supabase
      .from('teacher_availability')
      .select('id, teacher_id, time_slot, is_available, is_booked')
      .eq('date', dateStr)
      .in('time_slot', timeSlots)
      .eq('is_available', true)
      .eq('is_booked', false);
    
    console.log('Broad search availability:', availability);
    
    if (!availability || availability.length === 0) return [];
    
    const teacherIds = Array.from(new Set(availability.map(a => a.teacher_id)));
    const qualifiedTeachers = await this.getQualifiedTeachers(teacherIds, teacherType);
    
    // Return results for the target hour if found
    const targetTimeSlot = `${String(utcHour).padStart(2, '0')}:00:00`;
    const targetAvailability = availability.filter(a => a.time_slot === targetTimeSlot);
    
    const slots: GranularTimeSlot[] = [];
    
    if (targetAvailability.length > 0 && qualifiedTeachers && qualifiedTeachers.length > 0) {
      const timeRanges = convertClientHourToUTCRanges(selectedHour, timezoneOffset);
      
      qualifiedTeachers.forEach((teacher) => {
        const teacherAvailability = targetAvailability.find(a => a.teacher_id === teacher.id);
        if (teacherAvailability) {
          timeRanges.forEach((range, index) => {
            slots.push({
              id: `${teacherAvailability.id}-broad-${index}`,
              startTime: range.utcStartTime.substring(0, 5),
              endTime: range.utcEndTime.substring(0, 5),
              clientTimeDisplay: range.clientDisplay,
              egyptTimeDisplay: range.egyptDisplay,
              utcStartTime: range.utcStartTime,
              utcEndTime: range.utcEndTime,
              teacherId: teacher.id,
              teacherName: teacher.full_name || 'Unnamed Teacher',
              teacherType: teacher.teacher_type,
              isBooked: teacherAvailability.is_booked || false
            });
          });
        }
      });
    }
    
    return slots;
  }
}
