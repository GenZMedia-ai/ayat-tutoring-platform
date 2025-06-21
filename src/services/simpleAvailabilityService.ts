
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
    console.log('=== FIXED AVAILABILITY SEARCH START ===');
    console.log('Search parameters:', { 
      date: date.toDateString(), 
      timezone, 
      teacherType, 
      selectedHour 
    });
    
    // FIXED: Use the exact date as selected for database query
    const dateStr = date.toISOString().split('T')[0];
    const timezoneConfig = getTimezoneConfig(timezone);
    
    if (!timezoneConfig) {
      throw new Error(`Invalid timezone: ${timezone}`);
    }
    
    console.log('=== FIXED: PROPER TIMEZONE CONVERSION ===');
    const serverTime = convertClientTimeToServer(date, selectedHour, timezone);
    console.log('Server time conversion result:', {
      searchDate: dateStr,
      clientHour: selectedHour,
      utcHour: serverTime.utcHour,
      utcTime: serverTime.utcTime
    });
    
    // Search for the selected hour and the next 30 minutes
    const baseUtcHour = serverTime.utcHour;
    const startTime = `${String(baseUtcHour).padStart(2, '0')}:00:00`;
    const endTime = `${String(baseUtcHour + 1).padStart(2, '0')}:00:00`;
    
    console.log('FIXED: Time range filter for date', dateStr, ':', { 
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
    
    console.log('=== FIXED DATABASE QUERY ===');
    console.log('Query parameters for exact date match:', {
      date: dateStr,
      startTime,
      endTime,
      teacherTypes: teacherTypeFilter
    });
    
    // FIXED: Query database for the exact date requested
    const { data: availability, error: availabilityError } = await supabase
      .from('teacher_availability')
      .select('id, time_slot, teacher_id')
      .eq('date', dateStr) // Query for the exact date requested
      .eq('is_available', true)
      .eq('is_booked', false)
      .gte('time_slot', startTime)
      .lt('time_slot', endTime)
      .order('time_slot');
    
    console.log('FIXED: Database query result for date', dateStr, ':', {
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
      console.log('FIXED: No availability found for exact date and time range:', { 
        date: dateStr, 
        startTime, 
        endTime 
      });
      return [];
    }
    
    console.log(`FIXED: Found ${availability.length} availability records for exact date: ${dateStr}`);
    
    // Get unique teacher IDs
    const teacherIds = [...new Set(availability.map(slot => slot.teacher_id))];
    console.log('Unique teacher IDs found:', teacherIds);
    
    // Get teacher profiles
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
    
    console.log('=== FIXED RESULT PROCESSING ===');
    
    // FIXED: Process results using exact date matching
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
        
        // FIXED: Create UTC date for this slot using exact date
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
        
        console.log('FIXED: Processed slot for exact date:', {
          date: dateStr,
          id: formattedSlot.id,
          teacher: formattedSlot.teacherName,
          utcTime: formattedSlot.utcStartTime,
          clientTime: formattedSlot.clientTimeDisplay,
          egyptTime: formattedSlot.egyptTimeDisplay
        });
        
        return formattedSlot;
      });
    
    console.log('=== FIXED FINAL RESULTS ===');
    console.log(`FIXED: Successfully processed ${slots.length} available slots for exact date: ${dateStr}`);
    console.log('Slot summary:', slots.map(s => ({
      teacher: s.teacherName,
      time: s.clientTimeDisplay,
      utc: s.utcStartTime,
      date: dateStr
    })));
    console.log('=== FIXED AVAILABILITY SEARCH END ===');
    
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
