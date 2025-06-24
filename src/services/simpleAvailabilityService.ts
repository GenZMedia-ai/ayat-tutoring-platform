
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
      
      console.log('=== COMPREHENSIVE SEARCH: Enhanced with fallback ===');
      console.log('Selected hour:', selectedHour, 'Date:', dateStr, 'Timezone:', timezone);
      
      // CRITICAL FIX: Convert client hour to UTC before searching
      const serverTime = convertClientTimeToServer(date, selectedHour, timezone);
      const utcHour = serverTime.utcHour;
      
      console.log('UTC hour conversion:', { clientHour: selectedHour, utcHour, offset: timezoneConfig.offset });
      
      // Try exact hour first, then fallback to wider search
      let slots = await this.searchForSpecificHour(dateStr, utcHour, teacherType, timezoneConfig);
      
      if (slots.length === 0) {
        console.log('No slots found for exact hour, trying fallback search...');
        slots = await this.searchWithFallback(dateStr, utcHour, teacherType, timezoneConfig);
      }
      
      console.log('=== FINAL SEARCH RESULTS ===');
      console.log('Total slots found:', slots.length);
      console.log('Slots breakdown:', slots.map(s => ({ time: s.utcStartTime, teacher: s.teacherName, type: s.teacherType })));
      
      return slots;
    } catch (error) {
      console.error('Availability search error:', error);
      throw error;
    }
  }
  
  private static async searchForSpecificHour(
    dateStr: string,
    utcHour: number,
    teacherType: string,
    timezoneConfig: any
  ): Promise<SimpleTimeSlot[]> {
    // Search for BOTH 30-minute slots in the converted UTC hour
    const slot1Time = `${String(utcHour).padStart(2, '0')}:00:00`;
    const slot2Time = `${String(utcHour).padStart(2, '0')}:30:00`;
    
    console.log('Searching for exact UTC slots:', slot1Time, 'and', slot2Time);
    
    // FIXED: Enhanced teacher type filter - "mixed" teachers should appear in ALL searches
    let teacherTypeFilter: string[];
    if (teacherType === 'mixed') {
      teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
      console.log('Searching for ALL teacher types (mixed selected)');
    } else {
      teacherTypeFilter = [teacherType, 'mixed']; // Always include mixed teachers
      console.log(`Searching for ${teacherType} + mixed teachers`);
    }
    
    console.log('Teacher type filter array:', teacherTypeFilter);
    
    return await this.executeSearch(dateStr, [slot1Time, slot2Time], teacherTypeFilter, timezoneConfig);
  }
  
  private static async searchWithFallback(
    dateStr: string,
    baseUtcHour: number,
    teacherType: string,
    timezoneConfig: any
  ): Promise<SimpleTimeSlot[]> {
    console.log('=== FALLBACK SEARCH: ±1 hour range ===');
    
    // Search in a 3-hour window (base hour ± 1)
    const searchHours = [
      Math.max(0, baseUtcHour - 1),
      baseUtcHour,
      Math.min(23, baseUtcHour + 1)
    ];
    
    const timeSlots: string[] = [];
    searchHours.forEach(hour => {
      timeSlots.push(`${String(hour).padStart(2, '0')}:00:00`);
      timeSlots.push(`${String(hour).padStart(2, '0')}:30:00`);
    });
    
    console.log('Fallback search time slots:', timeSlots);
    
    // Enhanced teacher type filter for fallback
    let teacherTypeFilter: string[];
    if (teacherType === 'mixed') {
      teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
    } else {
      teacherTypeFilter = [teacherType, 'mixed']; // Always include mixed
    }
    
    return await this.executeSearch(dateStr, timeSlots, teacherTypeFilter, timezoneConfig);
  }
  
  private static async executeSearch(
    dateStr: string,
    timeSlots: string[],
    teacherTypeFilter: string[],
    timezoneConfig: any
  ): Promise<SimpleTimeSlot[]> {
    console.log('=== DATABASE QUERY EXECUTION ===');
    console.log('Date:', dateStr);
    console.log('Time slots to search:', timeSlots);
    console.log('Teacher types:', teacherTypeFilter);
    
    // Query database for available slots
    const { data: availability, error: availabilityError } = await supabase
      .from('teacher_availability')
      .select('id, time_slot, teacher_id')
      .eq('date', dateStr)
      .eq('is_available', true)
      .eq('is_booked', false)
      .in('time_slot', timeSlots)
      .order('time_slot');
    
    if (availabilityError) {
      console.error('Database query error:', availabilityError);
      throw availabilityError;
    }
    
    console.log('Raw availability data found:', availability?.length || 0, 'slots');
    console.log('Availability details:', availability);
    
    if (!availability || availability.length === 0) {
      console.log('❌ No availability found in teacher_availability table');
      
      // DEBUG: Show what's actually in the table for this date
      const { data: debugData } = await supabase
        .from('teacher_availability')
        .select('time_slot, teacher_id, is_available, is_booked')
        .eq('date', dateStr);
      
      console.log('DEBUG: All slots for this date:', debugData);
      return [];
    }
    
    // Get unique teacher IDs
    const teacherIds = [...new Set(availability.map(slot => slot.teacher_id))];
    console.log('Unique teacher IDs found:', teacherIds);
    
    // CRITICAL FIX: Get teacher profiles with enhanced logging
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, teacher_type, status, role')
      .in('id', teacherIds)
      .eq('status', 'approved')
      .eq('role', 'teacher');
    
    console.log('Teacher profiles query:', { profilesError, profileCount: profiles?.length });
    console.log('All profiles found:', profiles);
    
    if (profilesError) {
      console.error('Profiles query error:', profilesError);
      throw profilesError;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('❌ No approved teacher profiles found');
      
      // DEBUG: Show teacher profiles for these IDs
      const { data: debugProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, teacher_type, status, role')
        .in('id', teacherIds);
      
      console.log('DEBUG: All teacher profiles (any status):', debugProfiles);
      return [];
    }
    
    // ENHANCED: Filter teachers by type with comprehensive logging
    const filteredProfiles = profiles.filter(profile => {
      const isTypeMatch = teacherTypeFilter.includes(profile.teacher_type);
      console.log(`Teacher ${profile.full_name} (${profile.teacher_type}): ${isTypeMatch ? 'INCLUDED' : 'EXCLUDED'}`);
      return isTypeMatch;
    });
    
    console.log('Filtered profiles after teacher type filter:', filteredProfiles.length);
    console.log('Filtered teachers:', filteredProfiles.map(p => ({ name: p.full_name, type: p.teacher_type })));
    
    if (filteredProfiles.length === 0) {
      console.log('❌ No teachers match the type filter');
      console.log('Available teacher types:', profiles.map(p => p.teacher_type));
      console.log('Requested teacher types:', teacherTypeFilter);
      return [];
    }
    
    // Create a map of approved teacher profiles for quick lookup
    const profileMap = new Map(filteredProfiles.map(profile => [profile.id, profile]));
    
    // Process results with enhanced logging
    const slots: SimpleTimeSlot[] = availability
      .filter(slot => {
        const hasProfile = profileMap.has(slot.teacher_id);
        if (!hasProfile) {
          console.log(`Slot ${slot.time_slot} for teacher ${slot.teacher_id}: NO MATCHING PROFILE`);
        }
        return hasProfile;
      })
      .map(slot => {
        const profile = profileMap.get(slot.teacher_id)!;
        const timeSlotStr = slot.time_slot;
        
        console.log(`Processing slot: ${timeSlotStr} with ${profile.full_name} (${profile.teacher_type})`);
        
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
    
    console.log('=== FINAL PROCESSED SLOTS ===');
    console.log('Total processed slots:', slots.length);
    slots.forEach(slot => {
      console.log(`✅ ${slot.utcStartTime} - ${slot.teacherName} (${slot.teacherType})`);
    });
    
    return slots;
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
