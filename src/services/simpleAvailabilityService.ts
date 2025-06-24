
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
      const timezoneConfig = getTimezoneConfig(timezone);
      
      if (!timezoneConfig) {
        throw new Error(`Invalid timezone: ${timezone}`);
      }
      
      console.log('🔍 === FIXED AVAILABILITY SEARCH START ===');
      console.log('📋 Input Parameters:', { 
        date: date.toString(),
        timezone, 
        teacherType, 
        selectedHour 
      });
      
      // STEP 1: FIXED - Convert client datetime to UTC with proper date handling
      const { utcHour, utcDateStr } = convertClientTimeToServer(date, selectedHour, timezone);
      console.log('🌍 FIXED Timezone Conversion:', { 
        clientHour: selectedHour, 
        utcHour, 
        clientDate: date.toISOString().split('T')[0],
        utcDate: utcDateStr,
        offset: timezoneConfig.offset 
      });
      
      // STEP 2: Build time slots to search for (both 30-minute slots in the hour)
      const timeSlots = [
        `${String(utcHour).padStart(2, '0')}:00:00`,
        `${String(utcHour).padStart(2, '0')}:30:00`
      ];
      console.log('⏰ Searching for UTC time slots on date:', utcDateStr, timeSlots);
      
      // STEP 3: Build teacher type filter
      const teacherTypeFilter = this.buildTeacherTypeFilter(teacherType);
      console.log('👥 Teacher types to search:', teacherTypeFilter);
      
      // STEP 4: FIXED QUERY - Use proper Supabase syntax without join
      console.log('📊 Executing FIXED availability query...');
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('date', utcDateStr)
        .eq('is_available', true)
        .eq('is_booked', false)
        .in('time_slot', timeSlots);
      
      if (availabilityError) {
        console.error('❌ Availability query error:', availabilityError);
        throw availabilityError;
      }
      
      console.log('📋 Raw availability data:', {
        dateQueried: utcDateStr,
        timeSlotsQueried: timeSlots,
        rawResults: availabilityData,
        resultCount: availabilityData?.length || 0
      });
      
      if (!availabilityData || availabilityData.length === 0) {
        console.log('⚠️ NO AVAILABILITY FOUND');
        return [];
      }
      
      // STEP 5: Get teacher details for available slots
      const teacherIds = [...new Set(availabilityData.map(slot => slot.teacher_id))];
      console.log('👥 Getting teacher details for IDs:', teacherIds);
      
      const { data: teachersData, error: teachersError } = await supabase
        .from('profiles')
        .select('id, full_name, teacher_type, status, role')
        .in('id', teacherIds)
        .eq('status', 'approved')
        .eq('role', 'teacher')
        .in('teacher_type', teacherTypeFilter);
      
      if (teachersError) {
        console.error('❌ Teachers query error:', teachersError);
        throw teachersError;
      }
      
      console.log('👥 Teacher data:', teachersData);
      
      if (!teachersData || teachersData.length === 0) {
        console.log('⚠️ NO MATCHING TEACHERS FOUND');
        return [];
      }
      
      // STEP 6: Build result slots by combining availability and teacher data
      const slots: SimpleTimeSlot[] = [];
      
      for (const availSlot of availabilityData) {
        const teacher = teachersData.find(t => t.id === availSlot.teacher_id);
        if (!teacher) continue;
        
        console.log(`✅ Building slot for ${teacher.full_name} at ${availSlot.time_slot}`);
        
        // Create UTC date for this slot
        const utcSlotDate = new Date(`${utcDateStr}T${availSlot.time_slot}.000Z`);
        const utcEndDate = new Date(utcSlotDate.getTime() + 30 * 60 * 1000);
        
        // Format times for display
        const clientDisplay = this.formatTimePair(utcSlotDate, utcEndDate, timezoneConfig.iana);
        const egyptDisplay = this.formatTimePair(utcSlotDate, utcEndDate, 'Africa/Cairo') + ' (Egypt)';
        
        const resultSlot = {
          id: availSlot.id,
          teacherId: availSlot.teacher_id,
          teacherName: teacher.full_name,
          teacherType: teacher.teacher_type,
          utcStartTime: availSlot.time_slot,
          utcEndTime: this.formatTime(utcEndDate, 'UTC'),
          clientTimeDisplay: clientDisplay,
          egyptTimeDisplay: egyptDisplay
        };
        
        console.log('📦 Built slot:', resultSlot);
        slots.push(resultSlot);
      }
      
      console.log('🎯 === FIXED FINAL RESULTS ===');
      console.log(`✅ Found ${slots.length} available slots with FIXED timezone conversion`);
      console.log('📋 FIXED final slots:', slots);
      console.log('🔍 === SEARCH END ===');
      
      return slots;
    } catch (error) {
      console.error('💥 CRITICAL ERROR in FIXED searchAvailableSlots:', error);
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
