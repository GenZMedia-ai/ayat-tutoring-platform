
import { supabase } from '@/integrations/supabase/client';
import { toZonedTime, format } from 'date-fns-tz';
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

// Define the proper type for the joined query result
interface AvailabilityWithProfile {
  id: string;
  time_slot: string;
  teacher_id: string;
  profiles: {
    id: string;
    full_name: string;
    teacher_type: string;
    status: string;
    role: string;
  } | null;
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
    
    // Create client date-time for the selected hour
    const clientDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      selectedHour,
      0,
      0
    );
    
    // Convert to UTC for database query
    const utcDateTime = new Date(clientDateTime.getTime() - (timezoneConfig.offset * 60 * 60 * 1000));
    const baseUtcHour = utcDateTime.getUTCHours();
    
    console.log('Timezone conversion:', {
      clientDateTime: clientDateTime.toISOString(),
      utcDateTime: utcDateTime.toISOString(),
      baseUtcHour
    });
    
    // Build teacher type filter
    let teacherTypeFilter: string[];
    if (teacherType === 'mixed') {
      teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
    } else {
      teacherTypeFilter = [teacherType, 'mixed'];
    }
    
    console.log('Teacher type filter:', teacherTypeFilter);
    
    // Search for available slots using proper Supabase join syntax
    const { data: availability, error } = await supabase
      .from('teacher_availability')
      .select(`
        id,
        time_slot,
        teacher_id,
        profiles!teacher_id(
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
      .order('time_slot');
    
    if (error) {
      console.error('Database query error:', error);
      throw error;
    }
    
    if (!availability || availability.length === 0) {
      console.log('No availability found');
      return [];
    }
    
    console.log(`Found ${availability.length} availability records`);
    
    // Filter by teacher type and convert to SimpleTimeSlot format
    const slots: SimpleTimeSlot[] = (availability as AvailabilityWithProfile[])
      .filter(record => {
        const profile = record.profiles;
        if (!profile) {
          console.log('No profile found for record:', record.id);
          return false;
        }
        
        const isValidTeacher = profile.status === 'approved' && 
                              profile.role === 'teacher' &&
                              teacherTypeFilter.includes(profile.teacher_type);
        
        if (!isValidTeacher) {
          console.log('Invalid teacher profile:', {
            status: profile.status,
            role: profile.role,
            teacherType: profile.teacher_type,
            requiredTypes: teacherTypeFilter
          });
        }
        
        return isValidTeacher;
      })
      .map(record => {
        const profile = record.profiles!;
        const timeSlotStr = record.time_slot;
        
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
          id: record.id,
          teacherId: record.teacher_id,
          teacherName: profile.full_name,
          teacherType: profile.teacher_type,
          utcStartTime: timeSlotStr,
          utcEndTime: format(utcEndDate, 'HH:mm:ss', { timeZone: 'UTC' }),
          clientTimeDisplay: `${clientStartTime}-${clientEndTime}`,
          egyptTimeDisplay: `${egyptStartTime}-${egyptEndTime} (Egypt)`
        };
      });
    
    console.log('Generated slots:', slots);
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
