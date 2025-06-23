import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStatusValidation } from './useStatusValidation';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const EGYPT_TIMEZONE = 'Africa/Cairo';

export const useStudentStatusManagement = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const userRole = user?.role || 'teacher';
  const { validateTransition, requiresConfirmation } = useStatusValidation(userRole);

  const validateStatusConstraint = async (newStatus: string) => {
    const validStatuses = [
      'pending', 'confirmed', 'trial-completed', 'trial-ghosted', 
      'awaiting-payment', 'paid', 'active', 'expired', 'cancelled', 'dropped'
    ];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`);
    }
  };

  const updateStudentStatus = async (studentId: string, newStatus: string, currentStatus?: string) => {
    setLoading(true);
    try {
      console.log('🔄 Updating student status:', { studentId, from: currentStatus, to: newStatus });

      // Validate status constraint
      await validateStatusConstraint(newStatus);

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

      // Verify student exists and get current status
      const { data: studentData, error: fetchError } = await supabase
        .from('students')
        .select('status, name')
        .eq('id', studentId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching student:', fetchError);
        toast.error('Student not found');
        return false;
      }

      console.log('📋 Current student status:', studentData.status, 'Target:', newStatus);
      
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
        'dropped': 'dropped',
        'expired': 'expired'
      };

      console.log('✅ Student status updated successfully');
      toast.success(`Student status updated to ${statusLabels[newStatus] || newStatus}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error in updateStudentStatus:', error);
      toast.error(error.message || 'Failed to update student status');
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
      console.log('🔄 PHASE 2 FIX: Starting reschedule with correct time handling:', { 
        studentId, newDate, newTime, reason, currentDate, currentTime 
      });
      
      // PHASE 2 FIX: Remove UTC conversion completely - use times as stored in DB
      const dateString = format(newDate, 'yyyy-MM-dd');
      const directTime = newTime; // Use time directly without conversion

      console.log('🕐 PHASE 2 FIX: Direct time handling (no UTC conversion):', {
        selectedTime: newTime,
        directTime: directTime,
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

      // PHASE 2 FIX: Check availability using direct time format
      const { data: availabilityCheck, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('date', dateString)
        .eq('time_slot', directTime) // PHASE 2 FIX: Use direct time
        .eq('is_available', true)
        .eq('is_booked', false)
        .single();

      if (availabilityError || !availabilityCheck) {
        console.error('❌ Slot not available:', availabilityError);
        toast.error('Selected time slot is no longer available');
        return false;
      }

      // PHASE 2 FIX: Free up old slot using correct time format
      if (oldDate && oldTime) {
        console.log('🔓 PHASE 2 FIX: Freeing old slot with correct time:', { oldDate, oldTime });
        const { error: oldSlotError } = await supabase
          .from('teacher_availability')
          .update({ 
            is_booked: false,
            student_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('teacher_id', teacherId)
          .eq('date', oldDate)
          .eq('time_slot', oldTime); // PHASE 2 FIX: Use stored time directly

        if (oldSlotError) {
          console.error('❌ Error freeing old slot:', oldSlotError);
          toast.error('Failed to free old time slot');
          return false;
        }
      }

      // PHASE 2 FIX: Book new slot using direct time
      console.log('🔒 PHASE 2 FIX: Booking new slot with direct time:', { teacherId, dateString, directTime });
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

      // PHASE 2 FIX: Update student with direct time
      console.log('📝 PHASE 2 FIX: Updating student record with direct time:', { studentId, dateString, directTime });
      const { error: studentUpdateError } = await supabase
        .from('students')
        .update({ 
          trial_date: dateString,
          trial_time: directTime, // PHASE 2 FIX: Use direct time
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (studentUpdateError) {
        console.error('❌ Error updating student:', studentUpdateError);
        toast.error('Failed to update student details');
        return false;
      }

      // Update session with reschedule info
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
          .eq('scheduled_date', oldDate || dateString)
          .eq('scheduled_time', oldTime || directTime) // PHASE 2 FIX: Use direct time
          .order('created_at', { ascending: false })
          .limit(1);

        if (sessionData && sessionData.length > 0) {
          const session = sessionData[0];
          const { error: sessionUpdateError } = await supabase
            .from('sessions')
            .update({
              scheduled_date: dateString,
              scheduled_time: directTime, // PHASE 2 FIX: Use direct time
              reschedule_count: (session.reschedule_count || 0) + 1,
              reschedule_reason: reason,
              original_date: session.original_date || oldDate,
              original_time: session.original_time || oldTime,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.id);

          if (sessionUpdateError) {
            console.error('❌ Error updating session:', sessionUpdateError);
            // Don't fail the operation for this
          }
        }
      }

      console.log('✅ PHASE 2 FIX: Student rescheduled successfully with direct time handling');
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
      
      // Validate status constraint
      await validateStatusConstraint(newStatus);
      
      const { error } = await supabase
        .from('students')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', studentIds);

      if (error) {
        console.error('❌ Error bulk updating student statuses:', error);
        
        if (error.message?.includes('students_status_check')) {
          toast.error(`Status '${newStatus}' is not allowed. Database constraint error.`);
        } else {
          toast.error('Failed to update student statuses');
        }
        return false;
      }

      toast.success(`Updated ${studentIds.length} students to ${newStatus}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error in bulkStatusUpdate:', error);
      toast.error(error.message || 'Failed to update student statuses');
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
