
import { supabase } from '@/integrations/supabase/client';
import { getTimezoneConfig, convertClientTimeToServer } from '@/utils/timezoneUtils';
import { formatInTimezone, EGYPT_TIMEZONE } from '@/utils/egyptTimezone';

export interface SimpleTimeSlot {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherType: string;
  utcStartTime: string;
  utcEndTime: string;
  clientTimeDisplay: string;
  egyptTimeDisplay: string;
}

export class SimpleAvailabilityService {
  static async searchAvailableSlots(
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ): Promise<SimpleTimeSlot[]> {
    try {
      // FIXED: Get timezone config and convert time BEFORE extracting date string
      const timezoneConfig = getTimezoneConfig(timezone);
      
      if (!timezoneConfig) {
        throw new Error(`Invalid timezone: ${timezone}`);
      }
      
      // FIXED: Convert client time to server preserving the selected date
      const serverTime = convertClientTimeToServer(date, selectedHour, timezone);
      
      // FIXED: Use the preserved date string instead of problematic UTC conversion
      const dateStr = serverTime.utcDateString;
      
      // Search for the selected hour and the next 30 minutes
      const baseUtcHour = serverTime.utcHour;
      const startTime = `${String(baseUtcHour).padStart(2, '0')}:00:00`;
      const endTime = `${String(baseUtcHour + 1).padStart(2, '0')}:00:00`;
      
      // Build teacher type filter
      let teacherTypeFilter: string[];
      if (teacherType === 'mixed') {
        teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
      } else {
        teacherTypeFilter = [teacherType, 'mixed'];
      }
      
      // Query database for available slots
      const { data: availability, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select('id, time_slot, teacher_id')
        .eq('date', dateStr)
        .eq('is_available', true)
        .eq('is_booked', false)
        .gte('time_slot', startTime)
        .lt('time_slot', endTime)
        .order('time_slot');
      
      if (availabilityError) {
        console.error('Database query error:', availabilityError);
        throw availabilityError;
      }
      
      if (!availability || availability.length === 0) {
        return [];
      }
      
      // Get unique teacher IDs
      const teacherIds = [...new Set(availability.map(slot => slot.teacher_id))];
      
      // Get teacher profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, teacher_type, status, role')
        .in('id', teacherIds)
        .eq('status', 'approved')
        .eq('role', 'teacher')
        .in('teacher_type', teacherTypeFilter);
      
      if (profilesError) {
        console.error('Profiles query error:', profilesError);
        throw profilesError;
      }
      
      if (!profiles || profiles.length === 0) {
        return [];
      }
      
      // Create a map of teacher profiles for quick lookup
      const profileMap = new Map(profiles.map(profile => [profile.id, profile]));
      
      // Process results
      const slots: SimpleTimeSlot[] = availability
        .filter(slot => profileMap.has(slot.teacher_id))
        .map(slot => {
          const profile = profileMap.get(slot.teacher_id)!;
          const timeSlotStr = slot.time_slot;
          
          // Create UTC date for this slot
          const utcSlotDate = new Date(`${dateStr}T${timeSlotStr}.000Z`);
          const utcEndDate = new Date(utcSlotDate.getTime() + 30 * 60 * 1000);
          
          // FIXED: Format times using Egypt timezone utility
          const clientStartTime = formatInTimezone(utcSlotDate, timezoneConfig.iana, 'h:mm a');
          const clientEndTime = formatInTimezone(utcEndDate, timezoneConfig.iana, 'h:mm a');
          
          // FIXED: Format times for Egypt timezone using utility
          const egyptStartTime = formatInTimezone(utcSlotDate, EGYPT_TIMEZONE, 'h:mm a');
          const egyptEndTime = formatInTimezone(utcEndDate, EGYPT_TIMEZONE, 'h:mm a');
          
          return {
            id: slot.id,
            teacherId: slot.teacher_id,
            teacherName: profile.full_name,
            teacherType: profile.teacher_type,
            utcStartTime: timeSlotStr,
            utcEndTime: utcEndDate.toISOString().split('T')[1].split('.')[0],
            clientTimeDisplay: `${clientStartTime}-${clientEndTime}`,
            egyptTimeDisplay: `${egyptStartTime}-${egyptEndTime} (Egypt)`
          };
        });
      
      return slots;
    } catch (error) {
      console.error('Availability search error:', error);
      throw error;
    }
  }
  
  // REMOVED: formatTimeInTimezone method - now using centralized utility
}
