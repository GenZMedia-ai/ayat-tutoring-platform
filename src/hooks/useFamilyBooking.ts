
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
      console.log('=== PHASE 1: FAMILY BOOKING WITH NOTIFICATIONS START ===');
      console.log('Family booking parameters:', {
        selectedDate: selectedDate.toDateString(),
        selectedDateISO: selectedDate.toISOString().split('T')[0],
        slotId: selectedSlot.id,
        teacherId: selectedSlot.teacherId,
        teacherType,
        studentCount: bookingData.students?.length || 0
      });

      const bookingDateString = selectedDate.toISOString().split('T')[0];

      // PHASE 1: Use enhanced edge function with family flag
      const { data, error } = await supabase.functions.invoke('enhanced-simple-book-trial', {
        body: {
          bookingData,
          isMultiStudent: true,
          selectedDate: bookingDateString,
          utcStartTime: selectedSlot.utcStartTime,
          teacherType,
          teacherId: selectedSlot.teacherId,
          isFamily: true
        }
      });

      console.log('Enhanced family booking response:', { data, error });

      if (error) {
        console.error('Enhanced family booking error:', error);
        
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
        
        console.log('Enhanced family booking success:', {
          teacherName,
          studentNames,
          studentCount,
          familyId: bookingResult.family_group_id,
          familyUniqueId: bookingResult.family_unique_id,
          notificationsSent: bookingResult.notifications_sent
        });
        
        toast.success(
          `✅ Family trial session booked successfully with ${teacherName}`,
          {
            duration: 5000,
            description: `Family: ${bookingData.parentName} • Students: ${studentNames} (${studentCount} children) • Time: ${selectedSlot.clientTimeDisplay}${
              bookingResult.notifications_sent ? ' • Teacher notified' : ''
            }`
          }
        );
        return true;
      } else {
        console.error('Enhanced family booking failed - no success flag');
        toast.error('Family booking failed - please try again');
        return false;
      }
    } catch (error) {
      console.error('Enhanced family booking exception:', error);
      
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
