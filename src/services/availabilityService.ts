
import { supabase } from '@/integrations/supabase/client';
import { GranularTimeSlot } from '@/types/availability';
import { convertClientHourToUTCRanges, getTimezoneConfig } from '@/utils/timezoneUtils';

export class AvailabilityService {
  static async searchAvailableSlots(
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ): Promise<GranularTimeSlot[]> {
    console.log('=== AVAILABILITY SERVICE DEBUG ===');
    console.log('Search Parameters:', { date: date.toDateString(), timezone, teacherType, selectedHour });
    
    const dateStr = date.toISOString().split('T')[0];
    const timezoneConfig = getTimezoneConfig(timezone);
    
    if (!timezoneConfig) {
      throw new Error(`Invalid timezone: ${timezone}`);
    }
    
    // Get UTC time ranges for the selected hour
    const timeRanges = convertClientHourToUTCRanges(selectedHour, timezoneConfig.offset);
    console.log('Generated time ranges:', timeRanges);
    
    const availableSlots: GranularTimeSlot[] = [];
    
    // Query database for each 30-minute slot
    for (let i = 0; i < timeRanges.length; i++) {
      const range = timeRanges[i];
      
      console.log(`Querying slot ${i + 1}: ${range.utcStartTime} - ${range.utcEndTime}`);
      
      // Query for availability in this specific 30-minute window
      const { data: availability, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select('id, teacher_id, time_slot, is_available, is_booked')
        .eq('date', dateStr)
        .gte('time_slot', range.utcStartTime)
        .lt('time_slot', range.utcEndTime)
        .eq('is_available', true)
        .eq('is_booked', false);
      
      if (availabilityError) {
        console.error('Availability query error:', availabilityError);
        continue;
      }
      
      console.log(`Raw availability data for slot ${i + 1}:`, availability);
      
      if (!availability || availability.length === 0) {
        console.log(`No availability found for slot ${i + 1}`);
        continue;
      }
      
      // Get unique teacher IDs
      const teacherIds = Array.from(new Set(availability.map(a => a.teacher_id)));
      console.log(`Teacher IDs with availability for slot ${i + 1}:`, teacherIds);
      
      // Query teacher profiles with proper type filtering
      let teacherQuery = supabase
        .from('profiles')
        .select('id, full_name, teacher_type, status, role')
        .in('id', teacherIds)
        .eq('status', 'approved')
        .eq('role', 'teacher');
      
      // Filter by teacher type: exact match OR mixed (since mixed can handle any type)
      if (teacherType === 'mixed') {
        teacherQuery = teacherQuery.eq('teacher_type', 'mixed');
      } else {
        teacherQuery = teacherQuery.or(`teacher_type.eq.${teacherType},teacher_type.eq.mixed`);
      }
      
      const { data: teachers, error: teachersError } = await teacherQuery;
      
      if (teachersError) {
        console.error('Teachers query error:', teachersError);
        continue;
      }
      
      console.log(`Qualified teachers for slot ${i + 1}:`, teachers);
      
      // Create slots for each qualified teacher
      if (teachers && teachers.length > 0) {
        teachers.forEach((teacher) => {
          const teacherAvailability = availability.find(a => a.teacher_id === teacher.id);
          if (teacherAvailability) {
            availableSlots.push({
              id: `${teacherAvailability.id}-${i}`,
              startTime: range.utcStartTime.substring(0, 5), // "14:00"
              endTime: range.utcEndTime.substring(0, 5),     // "14:30"
              clientTimeDisplay: range.clientDisplay,
              egyptTimeDisplay: range.egyptDisplay,
              utcStartTime: range.utcStartTime,
              utcEndTime: range.utcEndTime,
              teacherId: teacher.id,
              teacherName: teacher.full_name,
              teacherType: teacher.teacher_type,
              isBooked: teacherAvailability.is_booked || false
            });
          }
        });
      }
    }
    
    console.log('Final available slots:', availableSlots);
    console.log('=== END AVAILABILITY SERVICE ===');
    
    return availableSlots;
  }
}
