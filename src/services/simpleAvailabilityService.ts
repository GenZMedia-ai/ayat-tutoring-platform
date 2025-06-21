
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
    console.log('=== SIMPLIFIED AVAILABILITY SEARCH START ===');
    console.log('Parameters:', { 
      date: date.toDateString(), 
      timezone, 
      teacherType, 
      selectedHour 
    });
    
    // Use the SAME date as selected (no date shifting)
    const dateStr = date.toISOString().split('T')[0];
    const timezoneConfig = getTimezoneConfig(timezone);
    
    if (!timezoneConfig) {
      throw new Error(`Invalid timezone: ${timezone}`);
    }
    
    // PHASE 3: Use simplified timezone conversion
    console.log('=== PHASE 3: SIMPLIFIED TIMEZONE CONVERSION ===');
    const serverTime = convertClientTimeToServer(date, selectedHour, timezone);
    console.log('Simplified server time conversion result:', {
      originalDate: dateStr,
      preservedDate: serverTime.utcDateString,
      utcHour: serverTime.utcHour,
      utcTime: serverTime.utcTime
    });
    
    // Verify date preservation
    if (serverTime.utcDateString !== dateStr) {
      console.warn('⚠️ Date changed during conversion! This should not happen with simplified approach');
    } else {
      console.log('✅ Date preserved correctly during conversion');
    }
    
    // Search for the selected hour and the next 30 minutes
    const baseUtcHour = serverTime.utcHour;
    const startTime = `${String(baseUtcHour).padStart(2, '0')}:00:00`;
    const endTime = `${String(baseUtcHour + 1).padStart(2, '0')}:00:00`;
    
    console.log('Time range filter:', { 
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
    
    console.log('=== DATABASE QUERY ===');
    console.log('Query parameters:', {
      date: dateStr, // Using preserved date
      startTime,
      endTime,
      teacherTypes: teacherTypeFilter
    });
    
    // Query database using preserved date
    const { data: availability, error: availabilityError } = await supabase
      .from('teacher_availability')
      .select('id, time_slot, teacher_id')
      .eq('date', dateStr) // Use preserved date
      .eq('is_available', true)
      .eq('is_booked', false)
      .gte('time_slot', startTime)
      .lt('time_slot', endTime)
      .order('time_slot');
    
    console.log('Database query result:', {
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
      console.log('No availability found for time range on date:', dateStr);
      return [];
    }
    
    console.log(`Found ${availability.length} availability records for date: ${dateStr}`);
    
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
    
    console.log('=== RESULT PROCESSING ===');
    
    // Process results using preserved date
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
        
        // Create UTC date for this slot using preserved date
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
    console.log(`Successfully processed ${slots.length} available slots for date: ${dateStr}`);
    console.log('Slot summary:', slots.map(s => ({
      teacher: s.teacherName,
      time: s.clientTimeDisplay,
      utc: s.utcStartTime
    })));
    console.log('=== SIMPLIFIED AVAILABILITY SEARCH END ===');
    
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
