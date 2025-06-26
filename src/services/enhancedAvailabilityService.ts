
import { supabase } from '@/integrations/supabase/client';
import { toZonedTime, format } from 'date-fns-tz';
import { getTimezoneConfig, convertClientTimeToServer } from '@/utils/timezoneUtils';

export interface AggregatedTimeSlot {
  id: string;
  timeRange: string;
  clientTimeDisplay: string;
  egyptTimeDisplay: string;
  teacherCount: number;
  teachers: {
    id: string;
    name: string;
    type: string;
  }[];
  utcStartTime: string;
  utcEndTime: string;
}

export class EnhancedAvailabilityService {
  static async searchAggregatedSlots(
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ): Promise<AggregatedTimeSlot[]> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const timezoneConfig = getTimezoneConfig(timezone);
      
      if (!timezoneConfig) {
        throw new Error(`Invalid timezone: ${timezone}`);
      }
      
      const serverTime = convertClientTimeToServer(date, selectedHour, timezone);
      
      // Search for the selected hour and the next 30 minutes
      const baseUtcHour = serverTime.utcHour;
      const startTime = `${String(baseUtcHour).padStart(2, '0')}:00:00`;
      const endTime = `${String(baseUtcHour + 1).padStart(2, '0')}:00:00`;
      
      // Build teacher type filter
      let teacherTypeFilter: string[];
      if (teacherType === 'mixed') {
        teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
      } else {
        teacherTypeFilter = [teacherType, 'mixed'];
      }
      
      // Single optimized query with JOIN to reduce database roundtrips
      const { data: availability, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select(`
          id, 
          time_slot, 
          teacher_id,
          profiles!inner(
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
        .gte('time_slot', startTime)
        .lt('time_slot', endTime)
        .eq('profiles.status', 'approved')
        .eq('profiles.role', 'teacher')
        .in('profiles.teacher_type', teacherTypeFilter)
        .order('time_slot');
      
      if (availabilityError) {
        console.error('Enhanced availability query error:', availabilityError);
        throw availabilityError;
      }
      
      if (!availability || availability.length === 0) {
        return [];
      }
      
      // Group slots by time and aggregate teacher information
      const aggregatedSlots = this.aggregateSlotsByTime(availability, timezoneConfig, dateStr);
      
      return aggregatedSlots;
    } catch (error) {
      console.error('Enhanced availability search error:', error);
      throw error;
    }
  }
  
  private static aggregateSlotsByTime(
    availability: any[],
    timezoneConfig: any,
    dateStr: string
  ): AggregatedTimeSlot[] {
    const groupedSlots = new Map<string, {
      utcStartTime: string;
      utcEndTime: string;
      clientTimeDisplay: string;
      egyptTimeDisplay: string;
      teachers: { id: string; name: string; type: string }[];
    }>();
    
    availability.forEach(slot => {
      const profile = slot.profiles;
      const timeSlotStr = slot.time_slot;
      const timeKey = timeSlotStr; // Use time as key for grouping
      
      // Create UTC date for this slot
      const utcSlotDate = new Date(`${dateStr}T${timeSlotStr}.000Z`);
      const utcEndDate = new Date(utcSlotDate.getTime() + 30 * 60 * 1000);
      
      // Format times for client timezone
      const clientStartTime = this.formatTimeInTimezone(utcSlotDate, timezoneConfig.iana);
      const clientEndTime = this.formatTimeInTimezone(utcEndDate, timezoneConfig.iana);
      
      // Format times for Egypt timezone
      const egyptStartTime = this.formatTimeInTimezone(utcSlotDate, 'Africa/Cairo');
      const egyptEndTime = this.formatTimeInTimezone(utcEndDate, 'Africa/Cairo');
      
      if (!groupedSlots.has(timeKey)) {
        groupedSlots.set(timeKey, {
          utcStartTime: timeSlotStr,
          utcEndTime: format(utcEndDate, 'HH:mm:ss', { timeZone: 'UTC' }),
          clientTimeDisplay: `${clientStartTime}-${clientEndTime}`,
          egyptTimeDisplay: `${egyptStartTime}-${egyptEndTime}`,
          teachers: []
        });
      }
      
      const group = groupedSlots.get(timeKey)!;
      group.teachers.push({
        id: slot.teacher_id,
        name: profile.full_name,
        type: profile.teacher_type
      });
    });
    
    // Convert grouped slots to final format
    const result: AggregatedTimeSlot[] = [];
    let idCounter = 1;
    
    groupedSlots.forEach((group, timeKey) => {
      const timezoneLabel = timezoneConfig.label.split(' ')[0]; // Extract timezone name (e.g., "Saudi" from "Saudi Arabia (GMT+3)")
      
      result.push({
        id: `slot-${idCounter++}`,
        timeRange: timeKey,
        clientTimeDisplay: `${group.clientTimeDisplay} ${timezoneLabel} time (${group.egyptTimeDisplay} Egypt) - ${group.teachers.length} teachers available`,
        egyptTimeDisplay: group.egyptTimeDisplay,
        teacherCount: group.teachers.length,
        teachers: group.teachers,
        utcStartTime: group.utcStartTime,
        utcEndTime: group.utcEndTime
      });
    });
    
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
