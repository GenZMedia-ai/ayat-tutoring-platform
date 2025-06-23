
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

  // PHASE 1 FIX: Standardize time format to HH:MM:SS for database compatibility
  const formatTimeForDB = (time: string): string => {
    console.log('🕐 PHASE 1: Formatting time for database:', time);
    
    if (!time) {
      throw new Error('Time is required');
    }
    
    // If time is already in HH:MM:SS format, return as is
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
      console.log('✅ Time already in HH:MM:SS format:', time);
      return time;
    }
    
    // If time is in HH:MM format, add :00 seconds
    if (time.match(/^\d{2}:\d{2}$/)) {
      const formattedTime = `${time}:00`;
      console.log('✅ PHASE 1: Converted HH:MM to HH:MM:SS:', { input: time, output: formattedTime });
      return formattedTime;
    }
    
    throw new Error(`Invalid time format: ${time}. Expected HH:MM or HH:MM:SS`);
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
      console.log('🔄 PHASE 1-3: Starting enhanced reschedule with time standardization:', { 
        studentId, newDate, newTime, reason, currentDate, currentTime 
      });
      
      // PHASE 1 FIX: Standardize time format for database operations
      const dateString = format(newDate, 'yyyy-MM-dd');
      const dbFormattedNewTime = formatTimeForDB(newTime);
      const dbFormattedOldTime = currentTime ? formatTimeForDB(currentTime) : null;

      console.log('🕐 PHASE 1: Time standardization complete:', {
        originalNewTime: newTime,
        dbFormattedNewTime: dbFormattedNewTime,
        originalOldTime: currentTime,
        dbFormattedOldTime: dbFormattedOldTime,
        dateString: dateString
      });

      // Get student's current assignment details
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('assigned_teacher_id, trial_date, trial_time, family_group_id')
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
      const familyGroupId = studentData.family_group_id;

      console.log('📋 Student data retrieved:', {
        teacherId,
        oldDate,
        oldTime,
        familyGroupId,
        isFamily: !!familyGroupId
      });

      if (!teacherId) {
        toast.error('No teacher assigned to this student');
        return false;
      }

      // PHASE 3 FIX: Enhanced availability check with proper time format
      console.log('🔍 PHASE 3: Checking availability with standardized time format:', {
        teacherId,
        dateString,
        dbFormattedNewTime
      });

      const { data: availabilityCheck, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('date', dateString)
        .eq('time_slot', dbFormattedNewTime)
        .eq('is_available', true)
        .eq('is_booked', false)
        .single();

      if (availabilityError || !availabilityCheck) {
        console.error('❌ PHASE 3: Slot not available:', {
          error: availabilityError,
          query: { teacherId, dateString, time_slot: dbFormattedNewTime }
        });
        toast.error('Selected time slot is no longer available');
        return false;
      }

      console.log('✅ PHASE 3: New slot confirmed available:', availabilityCheck.id);

      // PHASE 4 FIX: Enhanced old slot freeing with proper error handling
      if (oldDate && oldTime) {
        const formattedOldTime = formatTimeForDB(oldTime);
        console.log('🔓 PHASE 4: Freeing old slot with enhanced error handling:', { 
          oldDate, 
          originalOldTime: oldTime,
          formattedOldTime: formattedOldTime 
        });

        const { data: oldSlotData, error: oldSlotError } = await supabase
          .from('teacher_availability')
          .update({ 
            is_booked: false,
            student_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('teacher_id', teacherId)
          .eq('date', oldDate)
          .eq('time_slot', formattedOldTime)
          .select();

        if (oldSlotError) {
          console.error('❌ PHASE 4: Error freeing old slot:', {
            error: oldSlotError,
            query: { teacherId, oldDate, time_slot: formattedOldTime }
          });
          toast.error('Failed to free old time slot');
          return false;
        }

        console.log('✅ PHASE 4: Old slot freed successfully:', oldSlotData);
      }

      // PHASE 3 FIX: Book new slot with standardized time
      console.log('🔒 PHASE 3: Booking new slot with standardized time:', { 
        availabilityId: availabilityCheck.id, 
        studentId,
        dbFormattedNewTime 
      });

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

      // PHASE 2 & 5 FIX: Update student/family with enhanced handling
      if (familyGroupId) {
        console.log('👨‍👩‍👧‍👦 PHASE 2: Updating family group with new schedule');
        // Update family group
        const { error: familyUpdateError } = await supabase
          .from('family_groups')
          .update({ 
            trial_date: dateString,
            trial_time: dbFormattedNewTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', familyGroupId);

        if (familyUpdateError) {
          console.error('❌ Error updating family group:', familyUpdateError);
          toast.error('Failed to update family details');
          return false;
        }

        // Update all students in the family
        const { error: familyStudentsUpdateError } = await supabase
          .from('students')
          .update({ 
            trial_date: dateString,
            trial_time: dbFormattedNewTime,
            updated_at: new Date().toISOString()
          })
          .eq('family_group_id', familyGroupId);

        if (familyStudentsUpdateError) {
          console.error('❌ Error updating family students:', familyStudentsUpdateError);
          toast.error('Failed to update family student details');
          return false;
        }

        console.log('✅ PHASE 2: Family group and all students updated successfully');
      } else {
        console.log('👤 PHASE 2: Updating individual student');
        // Update individual student
        const { error: studentUpdateError } = await supabase
          .from('students')
          .update({ 
            trial_date: dateString,
            trial_time: dbFormattedNewTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', studentId);

        if (studentUpdateError) {
          console.error('❌ Error updating student:', studentUpdateError);
          toast.error('Failed to update student details');
          return false;
        }

        console.log('✅ PHASE 2: Individual student updated successfully');
      }

      // PHASE 5 FIX: Enhanced session update with better error handling
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
          .eq('scheduled_time', dbFormattedOldTime || dbFormattedNewTime)
          .order('created_at', { ascending: false })
          .limit(1);

        if (sessionData && sessionData.length > 0) {
          const session = sessionData[0];
          const { error: sessionUpdateError } = await supabase
            .from('sessions')
            .update({
              scheduled_date: dateString,
              scheduled_time: dbFormattedNewTime,
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
          } else {
            console.log('✅ PHASE 5: Session updated with reschedule information');
          }
        }
      }

      console.log('✅ PHASE 1-5: Student rescheduled successfully with all enhancements');
      toast.success(`${familyGroupId ? 'Family' : 'Student'} trial session rescheduled successfully`);
      return true;
    } catch (error: any) {
      console.error('❌ Error in rescheduleStudent:', error);
      toast.error(`Failed to reschedule: ${error.message || 'Unknown error'}`);
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
