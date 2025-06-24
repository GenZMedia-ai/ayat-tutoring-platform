
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
      
      // STEP 4: Query availability table
      console.log('📊 Querying teacher_availability table...');
      const { data: availability, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select('id, time_slot, teacher_id, is_available, is_booked')
        .eq('date', dateStr)
        .eq('is_available', true)
        .eq('is_booked', false)
        .in('time_slot', timeSlots);
      
      if (availabilityError) {
        console.error('❌ Availability query error:', availabilityError);
        throw availabilityError;
      }
      
      console.log('📋 Raw availability data:', {
        dateQueried: dateStr,
        timeSlotsQueried: timeSlots,
        rawResults: availability,
        resultCount: availability?.length || 0
      });
      
      if (!availability || availability.length === 0) {
        console.log('⚠️ NO AVAILABILITY FOUND - Checking what exists in DB...');
        
        // Debug: Check what's actually in the DB for this date
        const { data: debugData } = await supabase
          .from('teacher_availability')
          .select('*')
          .eq('date', dateStr);
        
        console.log('🔍 All slots for this date:', debugData);
        
        // Check if we have any data for this teacher type
        const { data: teacherCheck } = await supabase
          .from('profiles')
          .select('id, full_name, teacher_type, status, role')
          .eq('status', 'approved')
          .eq('role', 'teacher')
          .in('teacher_type', teacherTypeFilter);
        
        console.log('👥 Available teachers for this type:', teacherCheck);
        
        return [];
      }
      
      // STEP 5: Get teacher profiles
      const teacherIds = [...new Set(availability.map(slot => slot.teacher_id))];
      console.log('👥 Teacher IDs found:', teacherIds);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, teacher_type, status, role')
        .in('id', teacherIds)
        .eq('status', 'approved')
        .eq('role', 'teacher')
        .in('teacher_type', teacherTypeFilter);
      
      if (profilesError) {
        console.error('❌ Profiles query error:', profilesError);
        throw profilesError;
      }
      
      console.log('👥 Teacher profiles found:', {
        profilesFound: profiles?.length || 0,
        profiles: profiles?.map(p => ({
          id: p.id,
          name: p.full_name,
          type: p.teacher_type
        }))
      });
      
      if (!profiles || profiles.length === 0) {
        console.log('⚠️ NO MATCHING TEACHERS FOUND');
        return [];
      }
      
      // STEP 6: Build profile map and result slots
      const profileMap = new Map(profiles.map(profile => [profile.id, profile]));
      console.log('🗺️ Profile map created with', profileMap.size, 'teachers');
      
      const slots: SimpleTimeSlot[] = availability
        .filter(slot => {
          const hasProfile = profileMap.has(slot.teacher_id);
          console.log(`🔍 Slot ${slot.id} (${slot.time_slot}) - Teacher ${slot.teacher_id} - Has Profile: ${hasProfile}`);
          return hasProfile;
        })
        .map(slot => {
          const profile = profileMap.get(slot.teacher_id)!;
          const timeSlotStr = slot.time_slot;
          
          console.log(`✅ Building slot for ${profile.full_name} at ${timeSlotStr}`);
          
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
          
          console.log('📦 Built slot:', resultSlot);
          return resultSlot;
        });
      
      console.log('🎯 === FINAL RESULTS ===');
      console.log(`✅ Found ${slots.length} available slots`);
      console.log('📋 Final slots:', slots);
      console.log('🔍 === DEBUGGING SESSION END ===');
      
      return slots;
    } catch (error) {
      console.error('💥 CRITICAL ERROR in searchAvailableSlots:', error);
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
