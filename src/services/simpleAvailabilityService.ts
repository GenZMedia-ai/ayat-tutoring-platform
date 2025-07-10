
import { supabase } from '@/integrations/supabase/client';
import { formatInTimezone } from '@/utils/egyptTimezone';
import { getTimezoneConfig, convertClientTimeToServer } from '@/utils/timezoneUtils';

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
      const timezoneConfig = getTimezoneConfig(timezone);
      
      if (!timezoneConfig) {
        throw new Error(`Invalid timezone: ${timezone}`);
      }
      
      const serverTime = convertClientTimeToServer(date, selectedHour, timezone);
      const dateStr = serverTime.utcDateString;
      
      const baseUtcHour = serverTime.utcHour;
      const startTime = `${String(baseUtcHour).padStart(2, '0')}:00:00`;
      const endTime = `${String(baseUtcHour + 1).padStart(2, '0')}:00:00`;
      
      let teacherTypeFilter: string[];
      if (teacherType === 'mixed') {
        teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
      } else {
        teacherTypeFilter = [teacherType, 'mixed'];
      }
      
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
      
      const teacherIds = [...new Set(availability.map(slot => slot.teacher_id))];
      
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
      
      const profileMap = new Map(profiles.map(profile => [profile.id, profile]));
      
      const slots: SimpleTimeSlot[] = availability
        .filter(slot => profileMap.has(slot.teacher_id))
        .map(slot => {
          const profile = profileMap.get(slot.teacher_id)!;
          const timeSlotStr = slot.time_slot;
          
          const utcSlotDate = new Date(`${dateStr}T${timeSlotStr}.000Z`);
          const utcEndDate = new Date(utcSlotDate.getTime() + 30 * 60 * 1000);
          
          // FIXED: Use centralized timezone formatting
          const clientStartTime = formatInTimezone(utcSlotDate, timezoneConfig.iana, 'h:mm a');
          const clientEndTime = formatInTimezone(utcEndDate, timezoneConfig.iana, 'h:mm a');
          
          const egyptStartTime = formatInTimezone(utcSlotDate, 'Africa/Cairo', 'h:mm a');
          const egyptEndTime = formatInTimezone(utcEndDate, 'Africa/Cairo', 'h:mm a');
          
          return {
            id: slot.id,
            teacherId: slot.teacher_id,
            teacherName: profile.full_name,
            teacherType: profile.teacher_type,
            utcStartTime: timeSlotStr,
            utcEndTime: `${String(utcEndDate.getUTCHours()).padStart(2, '0')}:${String(utcEndDate.getUTCMinutes()).padStart(2, '0')}:00`,
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

  static async searchAllAvailableSlots(
    date: Date,
    timezone: string,
    teacherType: string
  ): Promise<SimpleTimeSlot[]> {
    try {
      const timezoneConfig = getTimezoneConfig(timezone);
      
      if (!timezoneConfig) {
        throw new Error(`Invalid timezone: ${timezone}`);
      }
      
      // Use local date formatting to ensure correct date
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      let teacherTypeFilter: string[];
      if (teacherType === 'mixed') {
        teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
      } else {
        teacherTypeFilter = [teacherType, 'mixed'];
      }
      
      // Get all available slots for the entire day
      const { data: availability, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select('id, time_slot, teacher_id')
        .eq('date', dateStr)
        .eq('is_available', true)
        .eq('is_booked', false)
        .order('time_slot');
      
      if (availabilityError) {
        console.error('Database query error:', availabilityError);
        throw availabilityError;
      }
      
      if (!availability || availability.length === 0) {
        return [];
      }
      
      const teacherIds = [...new Set(availability.map(slot => slot.teacher_id))];
      
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
      
      const profileMap = new Map(profiles.map(profile => [profile.id, profile]));
      
      const slots: SimpleTimeSlot[] = availability
        .filter(slot => profileMap.has(slot.teacher_id))
        .map(slot => {
          const profile = profileMap.get(slot.teacher_id)!;
          const timeSlotStr = slot.time_slot;
          
          const utcSlotDate = new Date(`${dateStr}T${timeSlotStr}.000Z`);
          const utcEndDate = new Date(utcSlotDate.getTime() + 30 * 60 * 1000);
          
          // Use centralized timezone formatting
          const clientStartTime = formatInTimezone(utcSlotDate, timezoneConfig.iana, 'h:mm a');
          const clientEndTime = formatInTimezone(utcEndDate, timezoneConfig.iana, 'h:mm a');
          
          const egyptStartTime = formatInTimezone(utcSlotDate, 'Africa/Cairo', 'h:mm a');
          const egyptEndTime = formatInTimezone(utcEndDate, 'Africa/Cairo', 'h:mm a');
          
          return {
            id: slot.id,
            teacherId: slot.teacher_id,
            teacherName: profile.full_name,
            teacherType: profile.teacher_type,
            utcStartTime: timeSlotStr,
            utcEndTime: `${String(utcEndDate.getUTCHours()).padStart(2, '0')}:${String(utcEndDate.getUTCMinutes()).padStart(2, '0')}:00`,
            clientTimeDisplay: `${clientStartTime}-${clientEndTime}`,
            egyptTimeDisplay: `${egyptStartTime}-${egyptEndTime} (Egypt)`
          };
        });
      
      return slots;
    } catch (error) {
      console.error('All slots availability search error:', error);
      throw error;
    }
  }
}
