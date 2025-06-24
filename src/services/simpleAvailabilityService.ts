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
      // FIXED: Use UTC methods to ensure we get the correct date regardless of user's browser timezone
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const timezoneConfig = getTimezoneConfig(timezone);
      
      if (!timezoneConfig) {
        throw new Error(`Invalid timezone: ${timezone}`);
      }
      
      console.log('🔍 === COMPREHENSIVE DEBUGGING SESSION START ===');
      console.log('📋 Input Parameters:', { 
        date: date.toString(),
        dateStr,
        timezone, 
        teacherType, 
        selectedHour 
      });
      
      // STEP 1: Convert client time to UTC using real timezone data
      const { utcHour } = convertClientTimeToServer(date, selectedHour, timezone);
      console.log('🌍 Timezone Conversion Result:', { 
        clientHour: selectedHour, 
        utcHour, 
        offset: timezoneConfig.offset 
      });
      
      // STEP 2: Build time slots to search for (both 30-minute slots in the hour)
      const timeSlots = [
        `${String(utcHour).padStart(2, '0')}:00:00`,
        `${String(utcHour).padStart(2, '0')}:30:00`
      ];
      console.log('⏰ Searching for UTC time slots:', timeSlots);
      
      // STEP 3: Build teacher type filter
      const teacherTypeFilter = this.buildTeacherTypeFilter(teacherType);
      console.log('👥 Teacher types to search:', teacherTypeFilter);
      
      // STEP 4: FIXED QUERY - Join with profiles table and filter directly
      console.log('📊 Executing enhanced availability query with teacher filtering...');
      const { data: availabilityWithTeachers, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select(`
          id,
          time_slot,
          teacher_id,
          is_available,
          is_booked,
          profiles!inner (
            id,
            full_name,
            teacher_type,
            status,
            role
          )
        `)
        .eq('date', dateStr)
        .eq('is_available', true)
        .eq('is_booked', false)
        .in('time_slot', timeSlots)
        .eq('profiles.status', 'approved')
        .eq('profiles.role', 'teacher')
        .in('profiles.teacher_type', teacherTypeFilter);
      
      if (availabilityError) {
        console.error('❌ Enhanced availability query error:', availabilityError);
        throw availabilityError;
      }
      
      console.log('📋 Enhanced availability data with teacher filtering:', {
        dateQueried: dateStr,
        timeSlotsQueried: timeSlots,
        teacherTypesFiltered: teacherTypeFilter,
        rawResults: availabilityWithTeachers,
        resultCount: availabilityWithTeachers?.length || 0
      });
      
      if (!availabilityWithTeachers || availabilityWithTeachers.length === 0) {
        console.log('⚠️ NO AVAILABILITY FOUND AFTER ENHANCED FILTERING');
        
        // Debug: Check what's actually available for this date (without teacher filtering)
        const { data: debugData } = await supabase
          .from('teacher_availability')
          .select(`
            *,
            profiles (
              id,
              full_name,
              teacher_type,
              status,
              role
            )
          `)
          .eq('date', dateStr);
        
        console.log('🔍 All slots for this date (debug):', debugData);
        
        return [];
      }
      
      // STEP 5: Build result slots directly from the joined data
      const slots: SimpleTimeSlot[] = availabilityWithTeachers.map(slot => {
        const profile = slot.profiles;
        const timeSlotStr = slot.time_slot;
        
        console.log(`✅ Building enhanced slot for ${profile.full_name} at ${timeSlotStr}`);
        
        // Create UTC date for this slot
        const utcSlotDate = new Date(`${dateStr}T${timeSlotStr}.000Z`);
        const utcEndDate = new Date(utcSlotDate.getTime() + 30 * 60 * 1000);
        
        // Format times for display
        const clientDisplay = this.formatTimePair(utcSlotDate, utcEndDate, timezoneConfig.iana);
        const egyptDisplay = this.formatTimePair(utcSlotDate, utcEndDate, 'Africa/Cairo') + ' (Egypt)';
        
        const resultSlot = {
          id: slot.id,
          teacherId: slot.teacher_id,
          teacherName: profile.full_name,
          teacherType: profile.teacher_type,
          utcStartTime: timeSlotStr,
          utcEndTime: this.formatTime(utcEndDate, 'UTC'),
          clientTimeDisplay: clientDisplay,
          egyptTimeDisplay: egyptDisplay
        };
        
        console.log('📦 Built enhanced slot:', resultSlot);
        return resultSlot;
      });
      
      console.log('🎯 === ENHANCED FINAL RESULTS ===');
      console.log(`✅ Found ${slots.length} available slots with enhanced filtering`);
      console.log('📋 Enhanced final slots:', slots);
      console.log('🔍 === DEBUGGING SESSION END ===');
      
      return slots;
    } catch (error) {
      console.error('💥 CRITICAL ERROR in enhanced searchAvailableSlots:', error);
      throw error;
    }
  }
  
  private static buildTeacherTypeFilter(teacherType: string): string[] {
    const filter = teacherType === 'mixed' 
      ? ['kids', 'adult', 'mixed', 'expert']
      : [teacherType, 'mixed'];
    
    console.log(`🎯 Teacher type filter: ${teacherType} -> ${JSON.stringify(filter)}`);
    return filter;
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
    console.log('📊 Grouping slots by time:', slots.length, 'slots to group');
    
    const grouped = new Map<string, SimpleTimeSlot[]>();
    
    slots.forEach(slot => {
      const key = slot.utcStartTime;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(slot);
      console.log(`📦 Added slot to group ${key}:`, slot.teacherName);
    });
    
    const result: GroupedTimeSlot[] = [];
    
    grouped.forEach((teacherSlots, timeKey) => {
      const firstSlot = teacherSlots[0];
      
      const groupedSlot = {
        timeRange: firstSlot.clientTimeDisplay,
        clientTimeDisplay: firstSlot.clientTimeDisplay,
        egyptTimeDisplay: firstSlot.egyptTimeDisplay,
        teacherCount: teacherSlots.length,
        teachers: teacherSlots,
        utcStartTime: firstSlot.utcStartTime,
        utcEndTime: firstSlot.utcEndTime
      };
      
      console.log(`📊 Created grouped slot for ${timeKey}:`, {
        timeRange: groupedSlot.timeRange,
        teacherCount: groupedSlot.teacherCount,
        teachers: teacherSlots.map(t => t.teacherName)
      });
      
      result.push(groupedSlot);
    });
    
    const sortedResult = result.sort((a, b) => a.utcStartTime.localeCompare(b.utcStartTime));
    console.log('📊 Final grouped result:', sortedResult.length, 'time groups');
    
    return sortedResult;
  }
}
