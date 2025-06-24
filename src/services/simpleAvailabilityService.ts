
import { supabase } from '@/integrations/supabase/client';
import { getTimezoneConfig } from '@/utils/timezoneUtils';

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
      
      console.log('=== SIMPLIFIED SEARCH START ===');
      console.log('Parameters:', { date: dateStr, timezone, teacherType, selectedHour });
      
      // STEP 1: Simple timezone conversion
      const utcHour = this.convertToUTC(selectedHour, timezoneConfig.offset);
      console.log('Timezone conversion:', { clientHour: selectedHour, utcHour, offset: timezoneConfig.offset });
      
      // STEP 2: Search for exact 30-minute slots
      const timeSlots = [
        `${String(utcHour).padStart(2, '0')}:00:00`,
        `${String(utcHour).padStart(2, '0')}:30:00`
      ];
      console.log('Searching UTC slots:', timeSlots);
      
      // STEP 3: Build teacher type filter
      const teacherTypeFilter = this.buildTeacherTypeFilter(teacherType);
      console.log('Teacher types to search:', teacherTypeFilter);
      
      // STEP 4: Execute database search
      const slots = await this.executeSimpleSearch(dateStr, timeSlots, teacherTypeFilter, timezoneConfig);
      
      console.log('=== SEARCH COMPLETE ===');
      console.log(`Found ${slots.length} available slots`);
      
      return slots;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }
  
  private static convertToUTC(clientHour: number, offset: number): number {
    let utcHour = clientHour - offset;
    
    // Handle 0-23 boundary
    if (utcHour < 0) {
      utcHour += 24;
    } else if (utcHour >= 24) {
      utcHour -= 24;
    }
    
    return utcHour;
  }
  
  private static buildTeacherTypeFilter(teacherType: string): string[] {
    if (teacherType === 'mixed') {
      return ['kids', 'adult', 'mixed', 'expert'];
    }
    return [teacherType, 'mixed'];
  }
  
  private static async executeSimpleSearch(
    dateStr: string,
    timeSlots: string[],
    teacherTypeFilter: string[],
    timezoneConfig: any
  ): Promise<SimpleTimeSlot[]> {
    console.log('Database query:', { date: dateStr, timeSlots, teacherTypes: teacherTypeFilter });
    
    // Query availability
    const { data: availability, error: availabilityError } = await supabase
      .from('teacher_availability')
      .select('id, time_slot, teacher_id')
      .eq('date', dateStr)
      .eq('is_available', true)
      .eq('is_booked', false)
      .in('time_slot', timeSlots);
    
    if (availabilityError) {
      console.error('Availability query error:', availabilityError);
      throw availabilityError;
    }
    
    console.log(`Found ${availability?.length || 0} available time slots`);
    
    if (!availability || availability.length === 0) {
      return [];
    }
    
    // Get teacher profiles
    const teacherIds = [...new Set(availability.map(slot => slot.teacher_id))];
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, teacher_type')
      .in('id', teacherIds)
      .eq('status', 'approved')
      .eq('role', 'teacher')
      .in('teacher_type', teacherTypeFilter);
    
    if (profilesError) {
      console.error('Profiles query error:', profilesError);
      throw profilesError;
    }
    
    console.log(`Found ${profiles?.length || 0} matching teachers`);
    
    if (!profiles || profiles.length === 0) {
      return [];
    }
    
    // Create profile map
    const profileMap = new Map(profiles.map(profile => [profile.id, profile]));
    
    // Build result slots
    const slots: SimpleTimeSlot[] = availability
      .filter(slot => profileMap.has(slot.teacher_id))
      .map(slot => {
        const profile = profileMap.get(slot.teacher_id)!;
        const timeSlotStr = slot.time_slot;
        
        // Create UTC date for this slot
        const utcSlotDate = new Date(`${dateStr}T${timeSlotStr}.000Z`);
        const utcEndDate = new Date(utcSlotDate.getTime() + 30 * 60 * 1000);
        
        // Format times
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
    
    console.log(`Built ${slots.length} final slots`);
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
    
    // Group by UTC start time
    slots.forEach(slot => {
      const key = slot.utcStartTime;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(slot);
    });
    
    // Convert to grouped format
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
    
    // Sort by UTC start time
    return result.sort((a, b) => a.utcStartTime.localeCompare(b.utcStartTime));
  }
}
