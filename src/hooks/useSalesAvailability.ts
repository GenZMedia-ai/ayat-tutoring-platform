
import { useState } from 'react';
import { toast } from 'sonner';
import { AvailabilityService } from '@/services/availabilityService';
import { GranularTimeSlot } from '@/types/availability';
import { supabase } from '@/integrations/supabase/client';

export type BookingData = {
  studentName?: string;
  country: string;
  phone: string;
  platform: 'zoom' | 'google-meet';
  age?: number;
  notes?: string;
  parentName?: string;
  students?: { name: string; age: number }[];
};

// Add type for the RPC response
type BookingResponse = {
  success: boolean;
  teacher_name: string;
  teacher_id: string;
  session_id: string;
  student_names: string[];
  booked_time_slot: string;
};

export const useSalesAvailability = () => {
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<GranularTimeSlot[]>([]);

  const checkAvailability = async (
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ) => {
    setLoading(true);
    try {
      console.log('=== ENHANCED AVAILABILITY CHECK START ===');
      console.log('Request Parameters:', { date, timezone, teacherType, selectedHour });
      
      const slots = await AvailabilityService.searchAvailableSlots(
        date,
        timezone,
        teacherType,
        selectedHour
      );
      
      console.log('Enhanced slots received:', slots.length);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Enhanced availability check error:', error);
      toast.error('Failed to check availability');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const groupSlotsByTime = (slots: GranularTimeSlot[]) => {
    return slots.reduce((groups, slot) => {
      const key = `${slot.utcStartTime}-${slot.utcEndTime}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(slot);
      return groups;
    }, {} as Record<string, GranularTimeSlot[]>);
  };

  const bookTrialSession = async (
    bookingData: BookingData,
    selectedDate: Date,
    selectedSlot: GranularTimeSlot | GranularTimeSlot[],
    teacherType: string,
    isMultiStudent: boolean
  ): Promise<boolean> => {
    try {
      console.log('=== ENHANCED BOOKING START ===');
      console.log('Booking parameters:', { bookingData, selectedDate, selectedSlot, teacherType, isMultiStudent });
      
      // Remove sensitive PII data from logs for security
      const safeBookingData = {
        ...bookingData,
        phone: '[REDACTED]',
        studentName: bookingData.studentName ? '[REDACTED]' : undefined,
        parentName: bookingData.parentName ? '[REDACTED]' : undefined,
        students: bookingData.students ? bookingData.students.map(s => ({ ...s, name: '[REDACTED]' })) : undefined
      };
      console.log('Safe booking data:', safeBookingData);
      
      // Handle both single slot and array of slots
      const slots = Array.isArray(selectedSlot) ? selectedSlot : [selectedSlot];
      
      if (slots.length === 0) {
        console.error('No slots provided for booking');
        toast.error('No time slot selected');
        return false;
      }
      
      const firstSlot = slots[0];
      const utcStartTime = firstSlot.utcStartTime;
      const teacherId = firstSlot.teacherId;
      
      console.log('Enhanced booking details:', {
        utcStartTime,
        teacherId,
        teacherType,
        isMultiStudent
      });
      
      // Use the simplified booking function instead of the removed one
      const { data, error } = await supabase.rpc('simple_book_trial_session', {
        p_booking_data: bookingData,
        p_is_multi_student: isMultiStudent,
        p_selected_date: selectedDate.toISOString().split('T')[0],
        p_utc_start_time: utcStartTime,
        p_teacher_type: teacherType,
        p_teacher_id: teacherId
      });

      console.log('Enhanced booking response:', { data, error });

      if (error) {
        console.error('Enhanced booking error:', error);
        toast.error(`Booking failed: ${error.message}`);
        return false;
      }

      // Type cast the response data to our expected type
      const bookingResult = data as BookingResponse;
      
      if (bookingResult?.success) {
        const studentNames = bookingResult.student_names || [];
        const teacherName = bookingResult.teacher_name || 'Unknown Teacher';
        
        console.log('Enhanced booking success:', {
          teacherName,
          studentCount: Array.isArray(studentNames) ? studentNames.length : 1,
          sessionId: bookingResult.session_id
        });
        
        const displayNames = Array.isArray(studentNames) ? studentNames.join(', ') : studentNames;
        toast.success(
          `Trial session booked successfully with ${teacherName} for ${displayNames}`
        );
        return true;
      } else {
        console.error('Enhanced booking failed - no success flag');
        toast.error('Booking failed - please try again');
        return false;
      }
    } catch (error) {
      console.error('Enhanced booking exception:', error);
      toast.error('Booking failed due to system error');
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
