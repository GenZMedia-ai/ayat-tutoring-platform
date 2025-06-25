
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
      
      console.log('🔍 === SIMPLE AVAILABILITY SEARCH START ===');
      console.log('📋 Input Parameters:', { 
        date: date.toString(),
        timezone, 
        teacherType, 
        selectedHour 
      });
      
      // Simple UTC conversion
      const utcHour = selectedHour - timezoneConfig.offset;
      const adjustedUtcHour = utcHour < 0 ? utcHour + 24 : utcHour >= 24 ? utcHour - 24 : utcHour;
      const utcDateStr = date.toISOString().split('T')[0];
      
      console.log('🌍 Simple Timezone Conversion:', { 
        clientHour: selectedHour, 
        utcHour: adjustedUtcHour,
        offset: timezoneConfig.offset 
      });
      
      // Build time slots to search for (both 30-minute slots in the hour)
      const timeSlots = [
        `${String(adjustedUtcHour).padStart(2, '0')}:00:00`,
        `${String(adjustedUtcHour).padStart(2, '0')}:30:00`
      ];
      
      console.log('⏰ Searching for UTC time slots on date:', utcDateStr, timeSlots);
      
      // Build teacher type filter
      const teacherTypeFilter = this.buildTeacherTypeFilter(teacherType);
      console.log('👥 Teacher types to search:', teacherTypeFilter);
      
      // Simple query for availability
      console.log('📊 Executing simple availability query...');
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
      
      // Get teacher details for available slots
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
      
      // Build simple result slots
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
      
      console.log('🎯 === SIMPLE FINAL RESULTS ===');
      console.log(`✅ Found ${slots.length} available slots`);
      console.log('📋 Simple final slots:', slots);
      console.log('🔍 === SEARCH END ===');
      
      return slots;
    } catch (error) {
      console.error('💥 CRITICAL ERROR in simple searchAvailableSlots:', error);
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
}
