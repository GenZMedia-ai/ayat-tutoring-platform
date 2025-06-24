
import { supabase } from '@/integrations/supabase/client';
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
      
      console.log('=== REAL DATABASE SEARCH START ===');
      console.log('Search parameters:', { date: dateStr, timezone, teacherType, selectedHour });
      
      // STEP 1: Convert client time to UTC using real timezone data
      const { utcHour } = convertClientTimeToServer(date, selectedHour, timezone);
      console.log('Real timezone conversion:', { clientHour: selectedHour, utcHour, offset: timezoneConfig.offset });
      
      // STEP 2: Search for exact 30-minute slots in UTC (real database times)
      const timeSlots = [
        `${String(utcHour).padStart(2, '0')}:00:00`,
        `${String(utcHour).padStart(2, '0')}:30:00`
      ];
      console.log('Searching real UTC time slots:', timeSlots);
      
      // STEP 3: Build teacher type filter based on real selection
      const teacherTypeFilter = this.buildTeacherTypeFilter(teacherType);
      console.log('Real teacher types to search:', teacherTypeFilter);
      
      // STEP 4: Execute real database search with user selections
      const slots = await this.executeRealDatabaseSearch(dateStr, timeSlots, teacherTypeFilter, timezoneConfig);
      
      console.log('=== REAL DATABASE SEARCH COMPLETE ===');
      console.log(`Found ${slots.length} real available slots from database`);
      
      return slots;
    } catch (error) {
      console.error('Real database search error:', error);
      throw error;
    }
  }
  
  private static buildTeacherTypeFilter(teacherType: string): string[] {
    // Real teacher type filtering based on actual selection
    if (teacherType === 'mixed') {
      return ['kids', 'adult', 'mixed', 'expert'];
    }
    return [teacherType, 'mixed'];
  }
  
  private static async executeRealDatabaseSearch(
    dateStr: string,
    timeSlots: string[],
    teacherTypeFilter: string[],
    timezoneConfig: any
  ): Promise<SimpleTimeSlot[]> {
    console.log('Real database query with user selections:', { date: dateStr, timeSlots, teacherTypes: teacherTypeFilter });
    
    // Query real availability data from database
    const { data: availability, error: availabilityError } = await supabase
      .from('teacher_availability')
      .select('id, time_slot, teacher_id')
      .eq('date', dateStr)
      .eq('is_available', true)
      .eq('is_booked', false)
      .in('time_slot', timeSlots);
    
    if (availabilityError) {
      console.error('Real availability query error:', availabilityError);
      throw availibilityError;
    }
    
    console.log(`Found ${availability?.length || 0} real available time slots in database`);
    
    if (!availability || availability.length === 0) {
      return [];
    }
    
    // Get real teacher profiles from database
    const teacherIds = [...new Set(availability.map(slot => slot.teacher_id))];
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, teacher_type')
      .in('id', teacherIds)
      .eq('status', 'approved')
      .eq('role', 'teacher')
      .in('teacher_type', teacherTypeFilter);
    
    if (profilesError) {
      console.error('Real profiles query error:', profilesError);
      throw profilesError;
    }
    
    console.log(`Found ${profiles?.length || 0} real matching teachers in database`);
    
    if (!profiles || profiles.length === 0) {
      return [];
    }
    
    // Create profile map from real data
    const profileMap = new Map(profiles.map(profile => [profile.id, profile]));
    
    // Build real result slots from database data
    const slots: SimpleTimeSlot[] = availability
      .filter(slot => profileMap.has(slot.teacher_id))
      .map(slot => {
        const profile = profileMap.get(slot.teacher_id)!;
        const timeSlotStr = slot.time_slot;
        
        // Create UTC date for this real slot
        const utcSlotDate = new Date(`${dateStr}T${timeSlotStr}.000Z`);
        const utcEndDate = new Date(utcSlotDate.getTime() + 30 * 60 * 1000);
        
        // Format times for display using real timezone data
        const clientDisplay = this.formatTimePair(utcSlotDate, utcEndDate, timezoneConfig.iana);
        const egyptDisplay = this.formatTimePair(utcSlotDate, utcEndDate, 'Africa/Cairo') + ' (Egypt)';
        
        return {
          id: slot.id,
          teacherId: slot.teacher_id,
          teacherName: profile.full_name,
          teacherType: profile.teacher_type,
          utcStartTime: timeSlotStr,
          utcEndTime: this.formatTime(utcEndDate, 'UTC'),
          clientTimeDisplay: clientDisplay,
          egyptTimeDisplay: egyptDisplay
        };
      });
    
    console.log(`Built ${slots.length} real slots from database data`);
    return slots;
  }
  
  private static formatTimePair(startDate: Date, endDate: Date, timeZone: string): string {
    const startTime = this.formatTime(startDate, timeZone);
    const endTime = this.formatTime(endDate, timeZone);
    return `${startTime}-${endTime}`;
  }
  
  private static formatTime(date: Date, timeZone: string): string {
    if (timeZone === 'UTC') {
      return date.toISOString().slice(11, 19);
    }
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }
  
  static groupSlotsByTime(slots: SimpleTimeSlot[]): GroupedTimeSlot[] {
    const grouped = new Map<string, SimpleTimeSlot[]>();
    
    // Group by real UTC start time from database
    slots.forEach(slot => {
      const key = slot.utcStartTime;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(slot);
    });
    
    // Convert to grouped format using real data
    const result: GroupedTimeSlot[] = [];
    
    grouped.forEach((teacherSlots, timeKey) => {
      const firstSlot = teacherSlots[0];
      
      result.push({
        timeRange: firstSlot.clientTimeDisplay,
        clientTimeDisplay: firstSlot.clientTimeDisplay,
        egyptTimeDisplay: firstSlot.egyptTimeDisplay,
        teacherCount: teacherSlots.length,
        teachers: teacherSlots,
        utcStartTime: firstSlot.utcStartTime,
        utcEndTime: firstSlot.utcEndTime
      });
    });
    
    // Sort by real UTC start time
    return result.sort((a, b) => a.utcStartTime.localeCompare(b.utcStartTime));
  }
}
