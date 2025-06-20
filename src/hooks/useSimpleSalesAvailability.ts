
import { useState } from 'react';
import { toast } from 'sonner';
import { SimpleAvailabilityService, SimpleTimeSlot } from '@/services/simpleAvailabilityService';
import { supabase } from '@/integrations/supabase/client';

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

  const checkAvailability = async (
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ) => {
    setLoading(true);
    try {
      console.log('=== SIMPLE AVAILABILITY CHECK START ===');
      console.log('Request Parameters:', { date, timezone, teacherType, selectedHour });
      
      const slots = await SimpleAvailabilityService.searchAvailableSlots(
        date,
        timezone,
        teacherType,
        selectedHour
      );
      
      console.log('Simple slots received:', slots.length);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Simple availability check error:', error);
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
    try {
      console.log('=== SIMPLE BOOKING START ===');
      console.log('Booking parameters:', { 
        selectedDate, 
        slotId: selectedSlot.id,
        teacherId: selectedSlot.teacherId,
        teacherType, 
        isMultiStudent 
      });
      
      // Use the simplified booking function
      const { data, error } = await supabase.rpc('simple_book_trial_session', {
        p_booking_data: bookingData,
        p_is_multi_student: isMultiStudent,
        p_selected_date: selectedDate.toISOString().split('T')[0],
        p_utc_start_time: selectedSlot.utcStartTime,
        p_teacher_type: teacherType,
        p_teacher_id: selectedSlot.teacherId
      });

      console.log('Simple booking response:', { data, error });

      if (error) {
        console.error('Simple booking error:', error);
        toast.error(`Booking failed: ${error.message}`);
        return false;
      }

      // Properly type cast the response
      const bookingResult = data as SimpleBookingResponse;

      if (bookingResult?.success) {
        const teacherName = bookingResult.teacher_name || 'Unknown Teacher';
        const studentNames = bookingResult.student_names || '';
        
        console.log('Simple booking success:', {
          teacherName,
          studentNames,
          sessionId: bookingResult.session_id
        });
        
        toast.success(
          `Trial session booked successfully with ${teacherName} for ${studentNames}`
        );
        return true;
      } else {
        console.error('Simple booking failed - no success flag');
        toast.error('Booking failed - please try again');
        return false;
      }
    } catch (error) {
      console.error('Simple booking exception:', error);
      toast.error('Booking failed due to system error');
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
