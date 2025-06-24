
import { useState } from 'react';
import { toast } from 'sonner';
import { SimpleAvailabilityService, SimpleTimeSlot, GroupedTimeSlot } from '@/services/simpleAvailabilityService';
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
  const [groupedSlots, setGroupedSlots] = useState<GroupedTimeSlot[]>([]);
  const { bookFamilyTrialSession } = useFamilyBooking();

  const checkAvailability = async (
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ) => {
    setLoading(true);
    try {
      console.log('=== SIMPLIFIED AVAILABILITY CHECK ===');
      console.log('Parameters:', { 
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
      
      console.log(`Found ${slots.length} available slots`);
      
      // Group slots by time
      const grouped = SimpleAvailabilityService.groupSlotsByTime(slots);
      console.log(`Grouped into ${grouped.length} time slots`);
      
      setAvailableSlots(slots);
      setGroupedSlots(grouped);
    } catch (error) {
      console.error('Availability check error:', error);
      toast.error('Failed to check availability');
      setAvailableSlots([]);
      setGroupedSlots([]);
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
      console.log('Routing to family booking system');
      return await bookFamilyTrialSession(bookingData, selectedDate, selectedSlot, teacherType);
    }

    // Single student booking
    try {
      console.log('=== SINGLE STUDENT BOOKING ===');
      console.log('Booking details:', { 
        date: selectedDate.toDateString(),
        slotId: selectedSlot.id,
        teacherId: selectedSlot.teacherId,
        teacherType, 
        isMultiStudent 
      });
      
      const bookingDateString = selectedDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('simple_book_trial_session', {
        p_booking_data: bookingData,
        p_is_multi_student: isMultiStudent,
        p_selected_date: bookingDateString,
        p_utc_start_time: selectedSlot.utcStartTime,
        p_teacher_type: teacherType,
        p_teacher_id: selectedSlot.teacherId
      });

      if (error) {
        console.error('Booking error:', error);
        toast.error(`Booking failed: ${error.message}`);
        return false;
      }

      const bookingResult = data as SimpleBookingResponse;

      if (bookingResult?.success) {
        const teacherName = bookingResult.teacher_name || 'Unknown Teacher';
        const studentNames = bookingResult.student_names || '';
        
        toast.success(
          `✅ Trial session booked successfully with ${teacherName} for ${studentNames}`,
          {
            duration: 5000,
            description: `Date: ${selectedDate.toDateString()} • Time: ${selectedSlot.clientTimeDisplay}`
          }
        );
        return true;
      } else {
        toast.error('Booking failed - please try again');
        return false;
      }
    } catch (error) {
      console.error('Booking exception:', error);
      toast.error('Booking failed due to system error');
      return false;
    }
  };

  return {
    loading,
    availableSlots,
    groupedSlots,
    checkAvailability,
    bookTrialSession
  };
};
