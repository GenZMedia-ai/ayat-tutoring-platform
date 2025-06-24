
import { supabase } from '@/integrations/supabase/client';
import { toZonedTime, format } from 'date-fns-tz';
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

export interface GroupedTimeSlot {
  timeRange: string;
  clientTimeDisplay: string;
  egyptTimeDisplay: string;
  teacherCount: number;
  teachers: SimpleTimeSlot[];
  utcStartTime: string;
  utcEndTime: string;
}

export class SimpleAvailabilityService {
  static async searchAvailableSlots(
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ): Promise<SimpleTimeSlot[]> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const timezoneConfig = getTimezoneConfig(timezone);
      
      if (!timezoneConfig) {
        throw new Error(`Invalid timezone: ${timezone}`);
      }
      
      console.log('=== FIXED SEARCH: Converting client hour to UTC ===');
      console.log('Selected hour:', selectedHour, 'Date:', dateStr, 'Timezone:', timezone);
      
      // CRITICAL FIX: Convert client hour to UTC before searching
      const serverTime = convertClientTimeToServer(date, selectedHour, timezone);
      const utcHour = serverTime.utcHour;
      
      console.log('UTC hour conversion:', { clientHour: selectedHour, utcHour, offset: timezoneConfig.offset });
      
      // PHASE 1 FIX: Search for BOTH 30-minute slots in the converted UTC hour
      const slot1Time = `${String(utcHour).padStart(2, '0')}:00:00`;
      const slot2Time = `${String(utcHour).padStart(2, '0')}:30:00`;
      
      console.log('Searching for UTC slots:', slot1Time, 'and', slot2Time);
      
      // Build teacher type filter
      let teacherTypeFilter: string[];
      if (teacherType === 'mixed') {
        teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
      } else {
        teacherTypeFilter = [teacherType, 'mixed'];
      }
      
      // Query database for available slots - search for BOTH specific times
      const { data: availability, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select('id, time_slot, teacher_id')
        .eq('date', dateStr)
        .eq('is_available', true)
        .eq('is_booked', false)
        .in('time_slot', [slot1Time, slot2Time])
        .order('time_slot');
      
      if (availabilityError) {
        console.error('Database query error:', availabilityError);
        throw availabilityError;
      }
      
      console.log('Raw availability data found:', availability?.length || 0, 'slots');
      console.log('Availability data:', availability);
      
      if (!availability || availability.length === 0) {
        console.log('No availability found for the selected hour slots');
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
        console.log('No approved teachers found for the criteria');
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
      
      console.log('=== FIXED SEARCH RESULTS ===');
      console.log('Total slots found:', slots.length);
      console.log('Slots breakdown:', slots.map(s => ({ time: s.utcStartTime, teacher: s.teacherName })));
      
      return slots;
    } catch (error) {
      console.error('Availability search error:', error);
      throw error;
    }
  }
  
  // PHASE 2: New method to group slots by time
  static groupSlotsByTime(slots: SimpleTimeSlot[]): GroupedTimeSlot[] {
    const grouped = new Map<string, SimpleTimeSlot[]>();
    
    // Group slots by their UTC start time
    slots.forEach(slot => {
      const key = slot.utcStartTime;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(slot);
    });
    
    // Convert to GroupedTimeSlot format
    const result: GroupedTimeSlot[] = [];
    
    grouped.forEach((teacherSlots, timeKey) => {
      const firstSlot = teacherSlots[0];
      
      // Create time range display
      const startTime = firstSlot.clientTimeDisplay.split('-')[0];
      const endTime = firstSlot.clientTimeDisplay.split('-')[1];
      
      result.push({
        timeRange: `${startTime} - ${endTime}`,
        clientTimeDisplay: firstSlot.clientTimeDisplay,
        egyptTimeDisplay: firstSlot.egyptTimeDisplay,
        teacherCount: teacherSlots.length,
        teachers: teacherSlots,
        utcStartTime: firstSlot.utcStartTime,
        utcEndTime: firstSlot.utcEndTime
      });
    });
    
    // Sort by UTC start time
    return result.sort((a, b) => a.utcStartTime.localeCompare(b.utcStartTime));
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
