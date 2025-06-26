
import { useState } from 'react';
import { toast } from 'sonner';
import { EnhancedAvailabilityService, AggregatedTimeSlot } from '@/services/enhancedAvailabilityService';
import { supabase } from '@/integrations/supabase/client';

export type EnhancedBookingData = {
  studentName?: string;
  country: string;
  phone: string;
  platform: 'zoom' | 'google-meet';
  age?: number;
  notes?: string;
  parentName?: string;
  students?: { name: string; age: number }[];
};

export const useEnhancedSalesAvailability = () => {
  const [loading, setLoading] = useState(false);
  const [aggregatedSlots, setAggregatedSlots] = useState<AggregatedTimeSlot[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  const checkAvailability = async (
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ) => {
    setLoading(true);
    try {
      console.log('=== ENHANCED AVAILABILITY CHECK START ===');
      console.log('Request Parameters:', { 
        date: date.toDateString(), 
        timezone, 
        teacherType, 
        selectedHour 
      });
      
      const slots = await EnhancedAvailabilityService.searchAggregatedSlots(
        date,
        timezone,
        teacherType,
        selectedHour
      );
      
      console.log('Enhanced aggregated slots received:', slots.length);
      setAggregatedSlots(slots);
      setSelectedTeachers([]);
    } catch (error) {
      console.error('Enhanced availability check error:', error);
      toast.error('Failed to check availability');
      setAggregatedSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const selectTeacher = (slotId: string, teacherId: string) => {
    setSelectedTeachers(prev => {
      const key = `${slotId}-${teacherId}`;
      if (prev.includes(key)) {
        return prev.filter(id => id !== key);
      } else {
        return [...prev.filter(id => !id.startsWith(slotId)), key];
      }
    });
  };

  const bookTrialSession = async (
    bookingData: EnhancedBookingData,
    selectedDate: Date,
    selectedSlot: AggregatedTimeSlot,
    teacherId: string,
    teacherType: string,
    isMultiStudent: boolean
  ): Promise<boolean> => {
    try {
      console.log('=== ENHANCED BOOKING START ===');
      
      const bookingDateString = selectedDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('simple_book_trial_session', {
        p_booking_data: bookingData,
        p_is_multi_student: isMultiStudent,
        p_selected_date: bookingDateString,
        p_utc_start_time: selectedSlot.utcStartTime,
        p_teacher_type: teacherType,
        p_teacher_id: teacherId
      });

      if (error) {
        console.error('Enhanced booking error:', error);
        toast.error(`Booking failed: ${error.message}`);
        return false;
      }

      if (data?.success) {
        const teacherName = data.teacher_name || 'Unknown Teacher';
        const studentNames = data.student_names || '';
        
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
      console.error('Enhanced booking exception:', error);
      toast.error('Booking failed due to system error');
      return false;
    }
  };

  return {
    loading,
    aggregatedSlots,
    selectedTeachers,
    checkAvailability,
    selectTeacher,
    bookTrialSession
  };
};
