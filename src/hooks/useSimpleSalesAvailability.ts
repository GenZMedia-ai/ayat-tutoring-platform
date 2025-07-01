
import { useState } from 'react';
import { toast } from 'sonner';
import { SimpleAvailabilityService, SimpleTimeSlot } from '@/services/simpleAvailabilityService';
import { supabase } from '@/integrations/supabase/client';
import { useFamilyBooking } from '@/hooks/useFamilyBooking';

export type SimpleBookingData = {
  studentName?: string;
  country: string;
  phone: string;
  platform: 'zoom' | 'google-meet';
  age?: number;
  notes?: string;
  parentName?: string;
  students?: { name: string; age: number }[];
};

// Type for the simple booking response
type SimpleBookingResponse = {
  success: boolean;
  teacher_name: string;
  teacher_id: string;
  session_id: string;
  student_names: string;
  booked_time_slot: string;
};

export const useSimpleSalesAvailability = () => {
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<SimpleTimeSlot[]>([]);
  const { bookFamilyTrialSession } = useFamilyBooking();

  const checkAvailability = async (
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ) => {
    setLoading(true);
    try {
      console.log('=== PHASE 4: SIMPLIFIED AVAILABILITY CHECK START ===');
      console.log('Request Parameters:', { 
        date: date.toDateString(), 
        timezone, 
        teacherType, 
        selectedHour 
      });
      
      const slots = await SimpleAvailabilityService.searchAvailableSlots(
        date,
        timezone,
        teacherType,
        selectedHour
      );
      
      console.log('Simplified slots received:', slots.length);
      console.log('Date preservation check: All slots should be for date:', date.toDateString());
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Simplified availability check error:', error);
      toast.error('Failed to check availability');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const bookTrialSession = async (
    bookingData: SimpleBookingData,
    selectedDate: Date,
    selectedSlot: SimpleTimeSlot,
    teacherType: string,
    isMultiStudent: boolean
  ): Promise<boolean> => {
    // Use family booking for multi-student sessions
    if (isMultiStudent) {
      console.log('=== PHASE 4: ROUTING TO FAMILY BOOKING SYSTEM ===');
      console.log('Selected date preservation:', selectedDate.toDateString());
      return await bookFamilyTrialSession(bookingData, selectedDate, selectedSlot, teacherType);
    }

    // Single student booking with date preservation
    try {
      console.log('=== PHASE 4: SINGLE STUDENT BOOKING START ===');
      console.log('Booking parameters with date preservation:', { 
        selectedDate: selectedDate.toDateString(),
        selectedDateISO: selectedDate.toISOString().split('T')[0],
        slotId: selectedSlot.id,
        teacherId: selectedSlot.teacherId,
        teacherType, 
        isMultiStudent 
      });
      
      // FIXED: Use proper local date formatting instead of toISOString()
      const bookingDateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      console.log('Date being sent to booking function:', bookingDateString);
      
      const { data, error } = await supabase.rpc('simple_book_trial_session', {
        p_booking_data: bookingData,
        p_is_multi_student: isMultiStudent,
        p_selected_date: bookingDateString, // Now using proper local date formatting
        p_utc_start_time: selectedSlot.utcStartTime,
        p_teacher_type: teacherType,
        p_teacher_id: selectedSlot.teacherId
      });

      console.log('Single student booking response:', { data, error });

      if (error) {
        console.error('Single student booking error:', error);
        
        let errorMessage = 'Booking failed - please try again';
        
        if (error.message?.includes('Cannot modify availability for today')) {
          errorMessage = 'Unable to book for today due to schedule protection. Please try a future date or contact support.';
        } else if (error.message?.includes('Time slot no longer available')) {
          errorMessage = 'This time slot was just booked by someone else. Please select another time.';
        } else if (error.message?.includes('Teacher not found')) {
          errorMessage = 'Teacher information is unavailable. Please refresh and try again.';
        } else if (error.message?.includes('Authentication required')) {
          errorMessage = 'Please log in again to complete the booking.';
        } else if (error.message?.includes('Access denied')) {
          errorMessage = 'You do not have permission to book sessions. Please contact your administrator.';
        } else if (error.message) {
          errorMessage = `Booking failed: ${error.message}`;
        }
        
        toast.error(errorMessage);
        return false;
      }

      const bookingResult = data as SimpleBookingResponse;

      if (bookingResult?.success) {
        const teacherName = bookingResult.teacher_name || 'Unknown Teacher';
        const studentNames = bookingResult.student_names || '';
        
        console.log('Single student booking success with date preservation:', {
          teacherName,
          studentNames,
          sessionId: bookingResult.session_id,
          originalDate: selectedDate.toDateString(),
          bookedDate: bookingDateString
        });
        
        toast.success(
          `✅ Trial session booked successfully with ${teacherName} for ${studentNames}`,
          {
            duration: 5000,
            description: `Date: ${selectedDate.toDateString()} • Time: ${selectedSlot.clientTimeDisplay}`
          }
        );
        return true;
      } else {
        console.error('Single student booking failed - no success flag');
        toast.error('Booking failed - please try again');
        return false;
      }
    } catch (error) {
      console.error('Single student booking exception:', error);
      
      let errorMessage = 'Booking failed due to system error';
      
      if (error instanceof Error) {
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorMessage = 'Network error - please check your connection and try again';
        } else if (error.message?.includes('timeout')) {
          errorMessage = 'Request timed out - please try again';
        } else {
          errorMessage = `System error: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
      return false;
    }
  };

  return {
    loading,
    availableSlots,
    checkAvailability,
    bookTrialSession
  };
};
