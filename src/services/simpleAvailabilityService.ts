
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

export class SimpleAvailabilityService {
  static async searchAvailableSlots(
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ): Promise<SimpleTimeSlot[]> {
    console.log('=== SIMPLE AVAILABILITY SEARCH START ===');
    console.log('Parameters:', { 
      date: date.toDateString(), 
      timezone, 
      teacherType, 
      selectedHour 
    });
    
    const dateStr = date.toISOString().split('T')[0];
    const timezoneConfig = getTimezoneConfig(timezone);
    
    if (!timezoneConfig) {
      throw new Error(`Invalid timezone: ${timezone}`);
    }
    
    // PHASE 1: Fix Timezone Conversion - Use the proper utility function
    console.log('=== PHASE 1: TIMEZONE CONVERSION ===');
    const serverTime = convertClientTimeToServer(date, selectedHour, timezone);
    console.log('Server time conversion result:', {
      utcDate: serverTime.utcDate.toISOString(),
      utcHour: serverTime.utcHour,
      utcTime: serverTime.utcTime
    });
    
    // PHASE 2: Expand Time Range Search - Include 30-minute slots
    console.log('=== PHASE 2: TIME RANGE EXPANSION ===');
    const baseUtcHour = serverTime.utcHour;
    
    // Search for the selected hour and the next 30 minutes
    const startTime = `${String(baseUtcHour).padStart(2, '0')}:00:00`;
    const endTime = `${String(baseUtcHour + 1).padStart(2, '0')}:00:00`;
    
    console.log('Expanded time range filter:', { 
      baseUtcHour,
      startTime, 
      endTime,
      searchWindow: '60 minutes (includes :00 and :30 slots)'
    });
    
    // Build teacher type filter
    let teacherTypeFilter: string[];
    if (teacherType === 'mixed') {
      teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
    } else {
      teacherTypeFilter = [teacherType, 'mixed'];
    }
    
    console.log('Teacher type filter:', teacherTypeFilter);
    
    // PHASE 3: Enhanced Debugging - Comprehensive logging
    console.log('=== PHASE 3: DATABASE QUERY ===');
    console.log('Query parameters:', {
      date: dateStr,
      startTime,
      endTime,
      teacherTypes: teacherTypeFilter
    });
    
    // First, get available slots filtered by time range
    const { data: availability, error: availabilityError } = await supabase
      .from('teacher_availability')
      .select('id, time_slot, teacher_id')
      .eq('date', dateStr)
      .eq('is_available', true)
      .eq('is_booked', false)
      .gte('time_slot', startTime)
      .lt('time_slot', endTime)
      .order('time_slot');
    
    console.log('Raw database query result:', {
      error: availabilityError,
      resultCount: availability?.length || 0,
      results: availability?.map(slot => ({
        id: slot.id,
        teacherId: slot.teacher_id,
        timeSlot: slot.time_slot
      }))
    });
    
    if (availabilityError) {
      console.error('Availability query error:', availabilityError);
      throw availabilityError;
    }
    
    if (!availability || availability.length === 0) {
      console.log('No availability found for time range:', { startTime, endTime });
      return [];
    }
    
    console.log(`Found ${availability.length} availability records in time range`);
    
    // Get unique teacher IDs
    const teacherIds = [...new Set(availability.map(slot => slot.teacher_id))];
    console.log('Unique teacher IDs found:', teacherIds);
    
    // Get teacher profiles separately
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, teacher_type, status, role')
      .in('id', teacherIds)
      .eq('status', 'approved')
      .eq('role', 'teacher')
      .in('teacher_type', teacherTypeFilter);
    
    console.log('Teacher profiles query result:', {
      error: profilesError,
      profileCount: profiles?.length || 0,
      profiles: profiles?.map(p => ({
        id: p.id,
        name: p.full_name,
        type: p.teacher_type
      }))
    });
    
    if (profilesError) {
      console.error('Profiles query error:', profilesError);
      throw profilesError;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('No valid teacher profiles found');
      return [];
    }
    
    console.log(`Found ${profiles.length} valid teacher profiles`);
    
    // Create a map of teacher profiles for quick lookup
    const profileMap = new Map(profiles.map(profile => [profile.id, profile]));
    
    // PHASE 4: Test with Known Data - Process and format results
    console.log('=== PHASE 4: RESULT PROCESSING ===');
    
    // Filter availability by valid teachers and convert to SimpleTimeSlot format
    const slots: SimpleTimeSlot[] = availability
      .filter(slot => {
        const hasProfile = profileMap.has(slot.teacher_id);
        if (!hasProfile) {
          console.log(`Filtering out slot ${slot.id} - no valid teacher profile`);
        }
        return hasProfile;
      })
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
        
        const formattedSlot = {
          id: slot.id,
          teacherId: slot.teacher_id,
          teacherName: profile.full_name,
          teacherType: profile.teacher_type,
          utcStartTime: timeSlotStr,
          utcEndTime: format(utcEndDate, 'HH:mm:ss', { timeZone: 'UTC' }),
          clientTimeDisplay: `${clientStartTime}-${clientEndTime}`,
          egyptTimeDisplay: `${egyptStartTime}-${egyptEndTime} (Egypt)`
        };
        
        console.log('Processed slot:', {
          id: formattedSlot.id,
          teacher: formattedSlot.teacherName,
          utcTime: formattedSlot.utcStartTime,
          clientTime: formattedSlot.clientTimeDisplay,
          egyptTime: formattedSlot.egyptTimeDisplay
        });
        
        return formattedSlot;
      });
    
    console.log('=== FINAL RESULTS ===');
    console.log(`Successfully processed ${slots.length} available slots`);
    console.log('Slot summary:', slots.map(s => ({
      teacher: s.teacherName,
      time: s.clientTimeDisplay,
      utc: s.utcStartTime
    })));
    console.log('=== SIMPLE AVAILABILITY SEARCH END ===');
    
    return slots;
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
