
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStatusValidation } from './useStatusValidation';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

const EGYPT_TIMEZONE = 'Africa/Cairo';

export const useStudentStatusManagement = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const userRole = user?.role || 'teacher';
  const { validateTransition, requiresConfirmation } = useStatusValidation(userRole);

  const updateStudentStatus = async (studentId: string, newStatus: string, currentStatus?: string) => {
    setLoading(true);
    try {
      console.log('🔄 Updating student status:', { studentId, from: currentStatus, to: newStatus });

      // Validate transition if current status is provided
      if (currentStatus && !validateTransition(currentStatus as any, newStatus as any)) {
        return false;
      }

      // Check if confirmation is required
      if (currentStatus) {
        const { required, message } = requiresConfirmation(currentStatus as any, newStatus as any);
        if (required && message) {
          const confirmed = window.confirm(message);
          if (!confirmed) {
            return false;
          }
        }
      }
      
      const { error } = await supabase
        .from('students')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) {
        console.error('❌ Error updating student status:', error);
        toast.error('Failed to update student status');
        return false;
      }

      const statusLabels: Record<string, string> = {
        'trial-completed': 'trial completed',
        'trial-ghosted': 'trial ghosted',
        'confirmed': 'confirmed',
        'pending': 'pending',
        'awaiting-payment': 'awaiting payment',
        'paid': 'paid',
        'active': 'active',
        'cancelled': 'cancelled',
        'dropped': 'dropped'
      };

      toast.success(`Student status updated to ${statusLabels[newStatus] || newStatus}`);
      return true;
    } catch (error) {
      console.error('❌ Error in updateStudentStatus:', error);
      toast.error('Failed to update student status');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const rescheduleStudent = async (
    studentId: string, 
    newDate: Date, 
    newTime: string, 
    reason: string,
    currentDate?: string,
    currentTime?: string
  ) => {
    setLoading(true);
    try {
      console.log('🔄 Rescheduling student:', { studentId, newDate, newTime, reason, currentDate, currentTime });
      
      // Convert Egypt time to UTC for database storage
      const dateString = format(newDate, 'yyyy-MM-dd');
      const egyptDateTimeString = `${dateString}T${newTime}:00`;
      const utcDateTime = fromZonedTime(egyptDateTimeString, EGYPT_TIMEZONE);
      const utcTime = utcDateTime.toISOString().substring(11, 19);

      console.log('🕐 Time conversion:', {
        egyptTime: newTime,
        utcTime: utcTime,
        newDate: dateString
      });

      // Get student's current assignment details
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('assigned_teacher_id, trial_date, trial_time')
        .eq('id', studentId)
        .single();

      if (studentError) {
        console.error('❌ Error fetching student data:', studentError);
        toast.error('Failed to fetch student details');
        return false;
      }

      const teacherId = studentData.assigned_teacher_id;
      const oldDate = studentData.trial_date;
      const oldTime = studentData.trial_time;

      if (!teacherId) {
        toast.error('No teacher assigned to this student');
        return false;
      }

      // Check if new slot is available
      const { data: availabilityCheck, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('date', dateString)
        .eq('time_slot', utcTime)
        .eq('is_available', true)
        .eq('is_booked', false)
        .single();

      if (availabilityError || !availabilityCheck) {
        console.error('❌ Slot not available:', availabilityError);
        toast.error('Selected time slot is no longer available');
        return false;
      }

      // CRITICAL FIX: Free up old slot first
      if (oldDate && oldTime) {
        console.log('🔓 Freeing old slot:', { oldDate, oldTime });
        const { error: oldSlotError } = await supabase
          .from('teacher_availability')
          .update({ 
            is_booked: false,
            student_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('teacher_id', teacherId)
          .eq('date', oldDate)
          .eq('time_slot', oldTime);

        if (oldSlotError) {
          console.error('❌ Error freeing old slot:', oldSlotError);
          toast.error('Failed to free old time slot');
          return false;
        }
      }

      // Book new slot
      console.log('🔒 Booking new slot:', { teacherId, dateString, utcTime });
      const { error: newSlotError } = await supabase
        .from('teacher_availability')
        .update({
          is_booked: true,
          student_id: studentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', availabilityCheck.id);

      if (newSlotError) {
        console.error('❌ Error booking new slot:', newSlotError);
        toast.error('Failed to book new time slot');
        return false;
      }

      // CRITICAL FIX: Update student trial date and time
      console.log('📝 Updating student record:', { studentId, dateString, utcTime });
      const { error: studentUpdateError } = await supabase
        .from('students')
        .update({ 
          trial_date: dateString,
          trial_time: utcTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (studentUpdateError) {
        console.error('❌ Error updating student:', studentUpdateError);
        toast.error('Failed to update student details');
        return false;
      }

      // CRITICAL FIX: Update session with proper original date/time capture
      const { data: sessionStudents, error: sessionStudentsError } = await supabase
        .from('session_students')
        .select('session_id')
        .eq('student_id', studentId);

      if (sessionStudentsError) {
        console.error('❌ Error fetching session students:', sessionStudentsError);
        // Don't fail the operation for this
      } else if (sessionStudents && sessionStudents.length > 0) {
        // Get the most recent session for this student
        const sessionIds = sessionStudents.map(ss => ss.session_id);
        const { data: sessionData, error: sessionFetchError } = await supabase
          .from('sessions')
          .select('id, reschedule_count, original_date, original_time, scheduled_date, scheduled_time')
          .in('id', sessionIds)
          .order('created_at', { ascending: false })
          .limit(1);

        if (sessionData && sessionData.length > 0) {
          const session = sessionData[0];
          
          // CRITICAL FIX: Properly capture original date/time before first reschedule
          const isFirstReschedule = (session.reschedule_count || 0) === 0;
          const originalDate = isFirstReschedule ? (oldDate || session.scheduled_date) : session.original_date;
          const originalTime = isFirstReschedule ? (oldTime || session.scheduled_time) : session.original_time;
          
          console.log('📅 Reschedule info:', {
            isFirstReschedule,
            currentRescheduleCount: session.reschedule_count,
            originalDate,
            originalTime,
            oldDate,
            oldTime
          });

          const { error: sessionUpdateError } = await supabase
            .from('sessions')
            .update({
              scheduled_date: dateString,
              scheduled_time: utcTime,
              reschedule_count: (session.reschedule_count || 0) + 1,
              reschedule_reason: reason,
              original_date: originalDate,
              original_time: originalTime,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.id);

          if (sessionUpdateError) {
            console.error('❌ Error updating session:', sessionUpdateError);
            // Don't fail the operation for this
          }
        }
      }

      console.log('✅ Student rescheduled successfully');
      toast.success('Student trial session rescheduled successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in rescheduleStudent:', error);
      toast.error('Failed to reschedule student');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const bulkStatusUpdate = async (studentIds: string[], newStatus: string) => {
    setLoading(true);
    try {
      console.log('🔄 Bulk updating student statuses:', { studentIds, newStatus });
      
      const { error } = await supabase
        .from('students')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', studentIds);

      if (error) {
        console.error('❌ Error bulk updating student statuses:', error);
        toast.error('Failed to update student statuses');
        return false;
      }

      toast.success(`Updated ${studentIds.length} students to ${newStatus}`);
      return true;
    } catch (error) {
      console.error('❌ Error in bulkStatusUpdate:', error);
      toast.error('Failed to update student statuses');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    updateStudentStatus,
    rescheduleStudent,
    bulkStatusUpdate
  };
};
