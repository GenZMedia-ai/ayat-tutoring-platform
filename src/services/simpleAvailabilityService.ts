
import { supabase } from '@/integrations/supabase/client';
import { toZonedTime, format } from 'date-fns-tz';
import { getTimezoneConfig, convertClientTimeToServerPreservingDate } from '@/utils/timezoneUtils';

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
      console.log('=== PHASE 1: SIMPLE SERVICE WITH DATE PRESERVATION ===');
      console.log('Search Parameters:', { 
        date: date.toDateString(), 
        dateISO: date.toISOString().split('T')[0],
        timezone, 
        teacherType, 
        selectedHour 
      });
      
      const timezoneConfig = getTimezoneConfig(timezone);
      
      if (!timezoneConfig) {
        throw new Error(`Invalid timezone: ${timezone}`);
      }
      
      // PHASE 1 FIX: Use date-preserving conversion
      const serverTime = convertClientTimeToServerPreservingDate(date, selectedHour, timezone);
      
      console.log('PHASE 1 FIXED: Date preservation verified:', {
        originalDate: date.toDateString(),
        preservedDateString: serverTime.utcDateString,
        dateMatches: date.toISOString().split('T')[0] === serverTime.utcDateString
      });
      
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
      
      // Query database for available slots using preserved date
      const { data: availability, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select('id, time_slot, teacher_id')
        .eq('date', serverTime.utcDateString) // Use preserved date
        .eq('is_available', true)
        .eq('is_booked', false)
        .gte('time_slot', startTime)
        .lt('time_slot', endTime)
        .order('time_slot');
      
      console.log('Database query with preserved date:', {
        searchDate: serverTime.utcDateString,
        startTime,
        endTime,
        resultsCount: availability?.length || 0
      });
      
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
      
      // Process results using preserved date
      const slots: SimpleTimeSlot[] = availability
        .filter(slot => profileMap.has(slot.teacher_id))
        .map(slot => {
          const profile = profileMap.get(slot.teacher_id)!;
          const timeSlotStr = slot.time_slot;
          
          // Create UTC date for this slot using preserved date
          const utcSlotDate = new Date(`${serverTime.utcDateString}T${timeSlotStr}.000Z`);
          const utcEndDate = new Date(utcSlotDate.getTime() + 30 * 60 * 1000);
          
          // Format times for client timezone
          const clientStartTime = this.formatTimeInTimezone(utcSlotDate, timezoneConfig.iana);
          const clientEndTime = this.formatTimeInTimezone(utcEndDate, timezoneConfig.iana);
          
          // Format times for Egypt timezone
          const egyptStartTime = this.formatTimeInTimezone(utcSlotDate, 'Africa/Cairo');
          const egyptEndTime = this.formatTimeInTimezone(utcEndDate, 'Africa/Cairo');
          
          return {
            id: slot.id,
            teacherId: slot.teacher_id,
            teacherName: profile.full_name,
            teacherType: profile.teacher_type,
            utcStartTime: timeSlotStr,
            utcEndTime: format(utcEndDate, 'HH:mm:ss', { timeZone: 'UTC' }),
            clientTimeDisplay: `${clientStartTime}-${clientEndTime}`,
            egyptTimeDisplay: `${egyptStartTime}-${egyptEndTime} (Egypt)`
          };
        });
      
      console.log('PHASE 1 FIXED: Final slots with date preservation:', {
        slotsCount: slots.length,
        searchDate: serverTime.utcDateString,
        datePreserved: true
      });
      
      return slots;
    } catch (error) {
      console.error('Availability search error:', error);
      throw error;
    }
  }
  
  private static formatTimeInTimezone(date: Date, timeZone: string): string {
    const zonedDate = toZonedTime(date, timeZone);
    const hour = zonedDate.getHours();
    const minutes = zonedDate.getMinutes();
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
  }
}
