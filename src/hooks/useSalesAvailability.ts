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
      const availableTeacherIds = slots.map(slot => slot.teacherId);
      
      console.log('Enhanced booking details:', {
        utcStartTime,
        availableTeacherIds: availableTeacherIds.length,
        teacherType,
        isMultiStudent
      });
      
      // Validate that we have teacher IDs
      if (availableTeacherIds.length === 0) {
        console.error('No teacher IDs available for booking');
        toast.error('No teachers available for this slot');
        return false;
      }
      
      // Format teacher IDs array properly for PostgreSQL
      const { data, error } = await supabase.rpc('book_trial_session', {
        p_booking_data: bookingData,
        p_is_multi_student: isMultiStudent,
        p_selected_date: selectedDate.toISOString().split('T')[0],
        p_utc_start_time: utcStartTime,
        p_teacher_type: teacherType,
        p_available_teacher_ids: availableTeacherIds // Pass as array directly
      });

      console.log('Enhanced booking response:', { data, error });

      if (error) {
        console.error('Enhanced booking error:', error);
        toast.error(`Booking failed: ${error.message}`);
        return false;
      }

      if (data?.success) {
        const studentNames = data.student_names || [];
        const teacherName = data.teacher_name || 'Unknown Teacher';
        
        console.log('Enhanced booking success:', {
          teacherName,
          studentCount: studentNames.length,
          sessionId: data.session_id
        });
        
        toast.success(
          `Trial session booked successfully with ${teacherName} for ${studentNames.join(', ')}`
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
