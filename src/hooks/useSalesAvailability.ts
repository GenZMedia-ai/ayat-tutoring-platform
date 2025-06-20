
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GranularTimeSlot } from '@/types/availability';
import { AvailabilityService } from '@/services/availabilityService';
import { convertClientHourToUTC, getTimezoneConfig } from '@/utils/timezoneUtils';

export interface BookingData {
  studentName: string;
  country: string;
  phone: string;
  platform: 'zoom' | 'google-meet';
  age: number;
  notes?: string;
  parentName?: string;
  students?: { name: string; age: number }[];
}

interface BookingResult {
  success: boolean;
  teacher_name: string;
  teacher_id: string;
  session_id: string;
  student_names: string[];
}

export const useSalesAvailability = () => {
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<GranularTimeSlot[]>([]);

  // Helper function to group slots by time for display
  const groupSlotsByTime = (slots: GranularTimeSlot[]) => {
    if (!slots) return {};
    return slots.reduce((acc, slot) => {
      const key = slot.clientTimeDisplay;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(slot);
      return acc;
    }, {} as Record<string, GranularTimeSlot[]>);
  };

  const runDiagnostics = async (
    date: Date, 
    teacherType: string, 
    timezone: string, 
    selectedHour: number
  ) => {
    const dateStr = date.toISOString().split('T')[0];
    const timezoneConfig = getTimezoneConfig(timezone);
    
    console.log('=== RUNNING ENHANCED DIAGNOSTICS (30-min slots) ===');
    console.log('Diagnostic Parameters:', { dateStr, teacherType, timezone, selectedHour });
    
    if (!timezoneConfig) {
      console.error('Invalid timezone:', timezone);
      return;
    }
    
    // Convert client hour to UTC (same as availability service)
    const utcHour = convertClientHourToUTC(selectedHour, timezoneConfig.offset);
    const startTime = `${String(Math.floor(utcHour)).padStart(2, '0')}:00:00`;
    const endHour = (Math.floor(utcHour) + 2) % 24;
    const endTime = `${String(endHour).padStart(2, '0')}:00:00`;
    
    console.log('Enhanced UTC Time Range:', { startTime, endTime, utcHour, timezoneOffset: timezoneConfig.offset });
    
    // Build teacher type filter
    let teacherTypeFilter: string[];
    if (teacherType === 'mixed') {
      teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
      console.log('Searching for mixed teachers - including all types');
    } else {
      teacherTypeFilter = [teacherType, 'mixed'];
      console.log(`Searching for ${teacherType} teachers - including mixed`);
    }
    
    console.log('Teacher Type Filter:', teacherTypeFilter);
    
    // Test the secure RPC function directly
    console.log('Testing enhanced secure RPC function...');
    const { data: rpcResults, error: rpcError } = await supabase
      .rpc('search_available_teachers', {
        p_date: dateStr,
        p_start_time: startTime,
        p_end_time: endTime,
        p_teacher_types: teacherTypeFilter
      });
    
    console.log('Enhanced RPC result:', { data: rpcResults, error: rpcError });
    
    // Build diagnostic message
    let message = `Enhanced Diagnostic Results for ${teacherType} teachers on ${dateStr}:\n`;
    message += `🕒 Searching expanded time range: ${startTime} - ${endTime} UTC (Client: ${selectedHour}:00 ${timezoneConfig.label})\n`;
    message += `🎯 Teacher type filter: [${teacherTypeFilter.join(', ')}]\n`;
    message += `🔐 Using enhanced secure RPC function\n`;
    
    if (rpcError) {
      message += `❌ Error calling enhanced RPC: ${rpcError.message}\n`;
    } else if (!rpcResults || rpcResults.length === 0) {
      message += `❌ No available teachers found via enhanced RPC\n`;
      message += `💡 This means no 30-minute slots exist in the expanded search range\n`;
    } else {
      message += `✅ Found ${rpcResults.length} teacher-slot combinations via enhanced RPC\n`;
      const teacherNames = [...new Set(rpcResults.map((r: any) => r.teacher_name))];
      message += `👥 Teachers: ${teacherNames.slice(0, 3).join(', ')}${teacherNames.length > 3 ? ` +${teacherNames.length - 3} more` : ''}\n`;
      const timeSlots = [...new Set(rpcResults.map((r: any) => r.time_slot))];
      message += `⏰ Time slots found: ${timeSlots.join(', ')}\n`;
      message += `🎯 Should now show all 30-minute slots in the hour range\n`;
    }
    
    console.log('Enhanced diagnostic message:', message);
    toast.info(message, { duration: 15000 });
  };

  const checkAvailability = async (
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ) => {
    setLoading(true);
    try {
      console.log('=== CHECKING ENHANCED AVAILABILITY (30-min slots) ===');
      console.log('Parameters:', { date: date.toDateString(), timezone, teacherType, selectedHour });
      
      const slots = await AvailabilityService.searchAvailableSlots(
        date,
        timezone,
        teacherType,
        selectedHour
      );
      
      setAvailableSlots(slots);
      
      if (slots.length === 0) {
        console.log('No slots found - running enhanced diagnostics...');
        await runDiagnostics(date, teacherType, timezone, selectedHour);
      } else {
        const teacherCount = new Set(slots.map(s => s.teacherId)).size;
        const groupedSlots = groupSlotsByTime(slots);
        const timeSlotCount = Object.keys(groupedSlots).length;
        const successMessage = `Found ${timeSlotCount} time slot(s) with ${teacherCount} teacher(s) available - Enhanced 30-min slot search working!`;
        console.log('Enhanced Success:', successMessage);
        toast.success(successMessage);
      }
      
    } catch (error) {
      console.error('Error checking enhanced availability:', error);
      toast.error(`Failed to check availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Map error codes to user-friendly messages
  const getErrorMessage = (error: any): string => {
    if (!error?.message) return 'Unknown error occurred';
    
    const message = error.message;
    
    // Check for specific error codes from our secure RPC function
    if (message.includes('P0001')) {
      return 'Authentication required. Please log in and try again.';
    }
    if (message.includes('P0002')) {
      return 'Access denied. Only approved sales agents can book sessions.';
    }
    if (message.includes('P0003')) {
      return 'No teachers available for this exact time slot. Please try a different time.';
    }
    if (message.includes('P0004')) {
      return 'Invalid booking information provided. Please check your data and try again.';
    }
    if (message.includes('P0005')) {
      return 'Booking failed due to system validation error. Please check all required fields and try again.';
    }
    
    // Generic database errors
    if (message.includes('permission denied') || message.includes('access denied')) {
      return 'You do not have permission to perform this action.';
    }
    
    // Return the original message if no specific mapping found
    return `Booking failed: ${message}`;
  };

  const bookTrialSession = async (
    bookingData: BookingData,
    selectedDate: Date,
    selectedSlots: GranularTimeSlot[],
    teacherType: string,
    isMultiStudent: boolean = false
  ) => {
    try {
      console.log('=== BOOKING WITH ENHANCED VALIDATION ===');
      console.log('Booking Parameters:', { 
        bookingData, 
        selectedDate: selectedDate.toDateString(), 
        selectedSlots: selectedSlots.length, 
        teacherType, 
        isMultiStudent 
      });
      
      if (!selectedSlots || selectedSlots.length === 0) {
        toast.error("No available teachers for this slot.");
        return false;
      }

      // CRITICAL FIX: Use the exact UTC start time from the selected slot
      const dateStr = selectedDate.toISOString().split('T')[0];
      const exactUtcStartTime = selectedSlots[0].utcStartTime; // This is the EXACT time from the slot
      const availableTeacherIds = selectedSlots.map(slot => slot.teacherId);

      console.log('CRITICAL - Exact booking parameters:', {
        dateStr,
        exactUtcStartTime, // This should match what was found in search
        availableTeacherIds,
        teacherType
      });

      // Prepare booking data as JSONB
      const rpcBookingData = isMultiStudent ? {
        phone: bookingData.phone,
        country: bookingData.country,
        platform: bookingData.platform,
        notes: bookingData.notes || null,
        parentName: bookingData.parentName,
        students: bookingData.students || []
      } : {
        studentName: bookingData.studentName,
        age: bookingData.age,
        phone: bookingData.phone,
        country: bookingData.country,
        platform: bookingData.platform,
        notes: bookingData.notes || null
      };

      console.log('Enhanced RPC booking call with exact time:', {
        p_booking_data: rpcBookingData,
        p_is_multi_student: isMultiStudent,
        p_selected_date: dateStr,
        p_utc_start_time: exactUtcStartTime, // EXACT match with search result
        p_teacher_type: teacherType,
        p_available_teacher_ids: availableTeacherIds
      });

      // Call the enhanced RPC function with exact timing
      const { data, error } = await supabase
        .rpc('book_trial_session', {
          p_booking_data: rpcBookingData,
          p_is_multi_student: isMultiStudent,
          p_selected_date: dateStr,
          p_utc_start_time: exactUtcStartTime, // CRITICAL: exact time from slot
          p_teacher_type: teacherType,
          p_available_teacher_ids: availableTeacherIds
        });

      if (error) {
        console.error('Enhanced RPC Booking Error:', error);
        const userMessage = getErrorMessage(error);
        toast.error(userMessage);
        return false;
      }

      // Safe type casting through unknown
      const result = data as unknown as BookingResult;
      
      if (!result || !result.success) {
        console.error('Enhanced booking failed - no result or success=false:', result);
        toast.error('Booking failed. Please try again.');
        return false;
      }

      // Success handling with proper typing
      console.log('Enhanced Booking Success:', result);
      
      if (isMultiStudent && result.student_names?.length > 1) {
        toast.success(
          `Family trial session booked successfully! Students: ${result.student_names.join(', ')} with teacher ${result.teacher_name} at exact time ${exactUtcStartTime}`
        );
      } else {
        const studentName = isMultiStudent ? result.student_names?.[0] : bookingData.studentName;
        toast.success(
          `Trial session booked successfully for ${studentName} with teacher ${result.teacher_name} at exact time ${exactUtcStartTime}!`
        );
      }

      return true;

    } catch (error) {
      console.error('Unexpected enhanced booking error:', error);
      const userMessage = getErrorMessage(error);
      toast.error(userMessage);
      return false;
    }
  };

  return {
    loading,
    availableSlots,
    groupSlotsByTime,
    checkAvailability,
    bookTrialSession
  };
};
