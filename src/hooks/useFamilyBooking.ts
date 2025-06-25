
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SimpleBookingData } from '@/hooks/useSimpleSalesAvailability';
import { SimpleTimeSlot } from '@/services/simpleAvailabilityService';
import { FamilyBookingResponse } from '@/types/family';

export const useFamilyBooking = () => {
  const [loading, setLoading] = useState(false);

  const bookFamilyTrialSession = async (
    bookingData: SimpleBookingData,
    selectedDate: Date,
    selectedSlot: SimpleTimeSlot,
    teacherType: string
  ): Promise<boolean> => {
    setLoading(true);
    
    try {
      console.log('=== FAMILY BOOKING START ===');
      console.log('Family booking parameters:', {
        selectedDate,
        slotId: selectedSlot.id,
        teacherId: selectedSlot.teacherId,
        teacherType,
        studentCount: bookingData.students?.length || 0
      });

      const { data, error } = await supabase.rpc('book_family_trial_session', {
        p_booking_data: bookingData,
        p_selected_date: selectedDate.toISOString().split('T')[0],
        p_utc_start_time: selectedSlot.utcStartTime,
        p_teacher_type: teacherType,
        p_teacher_id: selectedSlot.teacherId
      });

      console.log('Family booking response:', { data, error });

      if (error) {
        console.error('Family booking error:', error);
        
        let errorMessage = 'Family booking failed - please try again';
        
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
          errorMessage = `Family booking failed: ${error.message}`;
        }
        
        toast.error(errorMessage);
        return false;
      }

      // Type-safe conversion with proper validation
      const bookingResult = data as unknown as FamilyBookingResponse;

      if (bookingResult?.success) {
        const teacherName = bookingResult.teacher_name || 'Unknown Teacher';
        const studentNames = bookingResult.student_names || '';
        const studentCount = bookingResult.student_count || 0;
        
        console.log('Family booking success:', {
          teacherName,
          studentNames,
          studentCount,
          familyId: bookingResult.family_group_id,
          familyUniqueId: bookingResult.family_unique_id
        });
        
        toast.success(
          `✅ Family trial session booked successfully with ${teacherName}`,
          {
            duration: 5000,
            description: `Family: ${bookingData.parentName} • Students: ${studentNames} (${studentCount} children) • Time: ${selectedSlot.clientTimeDisplay}`
          }
        );
        return true;
      } else {
        console.error('Family booking failed - no success flag');
        toast.error('Family booking failed - please try again');
        return false;
      }
    } catch (error) {
      console.error('Family booking exception:', error);
      
      let errorMessage = 'Family booking failed due to system error';
      
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
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    bookFamilyTrialSession
  };
};
