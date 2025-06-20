
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
    
    console.log('=== RUNNING ENHANCED DIAGNOSTICS (Using Secure RPC) ===');
    console.log('Diagnostic Parameters:', { dateStr, teacherType, timezone, selectedHour });
    
    if (!timezoneConfig) {
      console.error('Invalid timezone:', timezone);
      return;
    }
    
    // Convert client hour to UTC (same as availability service)
    const utcHour = convertClientHourToUTC(selectedHour, timezoneConfig.offset);
    const startTime = `${String(utcHour).padStart(2, '0')}:00:00`;
    const endHour = (utcHour + 1) % 24;
    const endTime = `${String(endHour).padStart(2, '0')}:00:00`;
    
    console.log('UTC Time Range:', { startTime, endTime, utcHour, timezoneOffset: timezoneConfig.offset });
    
    // Build teacher type filter - FIXED TO USE CORRECT TEACHER TYPES
    let teacherTypeFilter: string[];
    if (teacherType === 'mixed') {
      teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
      console.log('Searching for mixed teachers - including all types');
    } else {
      teacherTypeFilter = [teacherType, 'mixed'];
      console.log(`Searching for ${teacherType} teachers - including mixed`);
    }
    
    console.log('Teacher Type Filter:', teacherTypeFilter);
    
    // Step 1: Test the secure RPC function directly
    console.log('Step 1: Testing secure RPC function...');
    const { data: rpcResults, error: rpcError } = await supabase
      .rpc('search_available_teachers', {
        p_date: dateStr,
        p_start_time: startTime,
        p_end_time: endTime,
        p_teacher_types: teacherTypeFilter
      });
    
    console.log('Secure RPC result:', { data: rpcResults, error: rpcError });
    
    // Build diagnostic message with enhanced details
    let message = `Diagnostic Results for ${teacherType} teachers on ${dateStr}:\n`;
    message += `🕒 Searching time range: ${startTime} - ${endTime} UTC (Client: ${selectedHour}:00 ${timezoneConfig.label})\n`;
    message += `🎯 Teacher type filter: [${teacherTypeFilter.join(', ')}] (FIXED - using correct system teacher types)\n`;
    message += `🔐 Using secure RPC function to bypass RLS issues\n`;
    
    if (rpcError) {
      message += `❌ Error calling secure RPC: ${rpcError.message}\n`;
    } else if (!rpcResults || rpcResults.length === 0) {
      message += `❌ No available teachers found via secure RPC\n`;
      message += `💡 This means either no availability exists or no teachers match the criteria\n`;
    } else {
      message += `✅ Found ${rpcResults.length} teacher-slot combinations via secure RPC\n`;
      const teacherNames = [...new Set(rpcResults.map((r: any) => r.teacher_name))];
      message += `👥 Teachers: ${teacherNames.slice(0, 3).join(', ')}${teacherNames.length > 3 ? ` +${teacherNames.length - 3} more` : ''}\n`;
      const timeSlots = [...new Set(rpcResults.map((r: any) => r.time_slot))];
      message += `⏰ Time slots: ${timeSlots.join(', ')}\n`;
    }
    
    const finalSlotCount = rpcResults?.length || 0;
    if (finalSlotCount === 0) {
      message += `❌ No final matching slots\n`;
    } else {
      message += `✅ RLS issue resolved - ${finalSlotCount} slots found via secure function\n`;
    }
    
    console.log('Final diagnostic message:', message);
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
      console.log('=== CHECKING AVAILABILITY (Using Secure RPC) ===');
      console.log('Parameters:', { date: date.toDateString(), timezone, teacherType, selectedHour });
      
      const slots = await AvailabilityService.searchAvailableSlots(
        date,
        timezone,
        teacherType,
        selectedHour
      );
      
      setAvailableSlots(slots);
      
      if (slots.length === 0) {
        console.log('No slots found - running detailed diagnostics...');
        await runDiagnostics(date, teacherType, timezone, selectedHour);
      } else {
        const teacherCount = new Set(slots.map(s => s.teacherId)).size;
        const groupedSlots = groupSlotsByTime(slots);
        const timeSlotCount = Object.keys(groupedSlots).length;
        const successMessage = `Found ${timeSlotCount} time slot(s) with ${teacherCount} teacher(s) available (RLS fix working!)`;
        console.log('Success:', successMessage);
        toast.success(successMessage);
      }
      
    } catch (error) {
      console.error('Error checking availability:', error);
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
    
    // Check for specific error codes
    if (message.includes('P0001')) {
      return 'Authentication required. Please log in and try again.';
    }
    if (message.includes('P0002')) {
      return 'Access denied. Only approved sales agents can book sessions.';
    }
    if (message.includes('P0003')) {
      return 'No teachers available for this time slot. Please try a different time.';
    }
    if (message.includes('P0004')) {
      return 'Invalid booking information provided. Please check your data and try again.';
    }
    if (message.includes('P0005')) {
      return 'Selected teacher is no longer available. Please refresh and try again.';
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
      console.log('=== BOOKING WITH SECURE RPC ===');
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

      // Prepare data for the secure RPC call
      const dateStr = selectedDate.toISOString().split('T')[0];
      const utcStartTime = selectedSlots[0].utcStartTime;
      const availableTeacherIds = selectedSlots.map(slot => slot.teacherId);

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

      console.log('Calling secure RPC with:', {
        p_booking_data: rpcBookingData,
        p_is_multi_student: isMultiStudent,
        p_selected_date: dateStr,
        p_utc_start_time: utcStartTime,
        p_teacher_type: teacherType,
        p_available_teacher_ids: availableTeacherIds
      });

      // Call the secure RPC function
      const { data: result, error } = await supabase
        .rpc('book_trial_session', {
          p_booking_data: rpcBookingData,
          p_is_multi_student: isMultiStudent,
          p_selected_date: dateStr,
          p_utc_start_time: utcStartTime,
          p_teacher_type: teacherType,
          p_available_teacher_ids: availableTeacherIds
        }) as { data: BookingResult | null, error: any };

      if (error) {
        console.error('RPC Booking Error:', error);
        const userMessage = getErrorMessage(error);
        toast.error(userMessage);
        return false;
      }

      if (!result || !result.success) {
        console.error('Booking failed - no result or success=false:', result);
        toast.error('Booking failed. Please try again.');
        return false;
      }

      // Success handling
      console.log('Booking Success:', result);
      
      if (isMultiStudent && result.student_names.length > 1) {
        toast.success(
          `Family trial session booked successfully! Students: ${result.student_names.join(', ')} with teacher ${result.teacher_name}`
        );
      } else {
        const studentName = isMultiStudent ? result.student_names[0] : bookingData.studentName;
        toast.success(
          `Trial session booked successfully for ${studentName} with teacher ${result.teacher_name}!`
        );
      }

      return true;

    } catch (error) {
      console.error('Unexpected booking error:', error);
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
