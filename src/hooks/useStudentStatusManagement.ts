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

  // CRITICAL FIX: Robust time format standardization
  const formatTimeForDB = (time: string): string => {
    console.log('🕐 CRITICAL FIX: Formatting time for database:', time);
    
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
      console.log('✅ CRITICAL FIX: Converted HH:MM to HH:MM:SS:', { input: time, output: formattedTime });
      return formattedTime;
    }
    
    throw new Error(`Invalid time format: ${time}. Expected HH:MM or HH:MM:SS`);
  };

  // CRITICAL FIX: Check if a date is today in Egypt timezone
  const isDateToday = (dateString: string): boolean => {
    const today = new Date();
    const egyptToday = new Date(today.toLocaleString("en-US", {timeZone: "Africa/Cairo"}));
    const egyptTodayString = format(egyptToday, 'yyyy-MM-dd');
    return dateString === egyptTodayString;
  };

  const updateStudentStatus = async (studentId: string, newStatus: string, currentStatus?: string) => {
    setLoading(true);
    try {
      console.log('🔄 Updating student status:', { studentId, from: currentStatus, to: newStatus });

      await validateStatusConstraint(newStatus);

      if (currentStatus && !validateTransition(currentStatus as any, newStatus as any)) {
        return false;
      }

      if (currentStatus) {
        const { required, message } = requiresConfirmation(currentStatus as any, newStatus as any);
        if (required && message) {
          const confirmed = window.confirm(message);
          if (!confirmed) {
            return false;
          }
        }
      }

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
      console.log('🔄 CRITICAL FIX: Starting enhanced reschedule with constraint handling:', { 
        studentId, newDate, newTime, reason, currentDate, currentTime 
      });
      
      // CRITICAL FIX: Standardize time format for database operations
      const dateString = format(newDate, 'yyyy-MM-dd');
      const dbFormattedNewTime = formatTimeForDB(newTime);
      const dbFormattedOldTime = currentTime ? formatTimeForDB(currentTime) : null;

      console.log('🕐 CRITICAL FIX: Time standardization complete:', {
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

      // CRITICAL FIX: Enhanced availability check with proper time format
      console.log('🔍 CRITICAL FIX: Checking availability with standardized time format:', {
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
        console.error('❌ CRITICAL FIX: Slot not available:', {
          error: availabilityError,
          query: { teacherId, dateString, time_slot: dbFormattedNewTime }
        });
        toast.error('Selected time slot is no longer available');
        return false;
      }

      console.log('✅ CRITICAL FIX: New slot confirmed available:', availabilityCheck.id);

      // CRITICAL FIX: Handle old slot freeing with constraint awareness
      if (oldDate && oldTime && dbFormattedOldTime) {
        console.log('🔓 CRITICAL FIX: Attempting to free old slot with constraint handling:', { 
          oldDate, 
          originalOldTime: oldTime,
          formattedOldTime: dbFormattedOldTime,
          isToday: isDateToday(oldDate)
        });

        // CRITICAL FIX: Check if trying to modify today's availability
        if (isDateToday(oldDate)) {
          console.log('⚠️ CRITICAL FIX: Cannot modify today\'s availability - skipping old slot freeing');
          toast.warning('Note: Cannot free today\'s time slot due to system constraints. The new slot will still be booked.');
        } else {
          const { data: oldSlotData, error: oldSlotError } = await supabase
            .from('teacher_availability')
            .update({ 
              is_booked: false,
              student_id: null,
              updated_at: new Date().toISOString()
            })
            .eq('teacher_id', teacherId)
            .eq('date', oldDate)
            .eq('time_slot', dbFormattedOldTime)
            .select();

          if (oldSlotError) {
            console.error('❌ CRITICAL FIX: Error freeing old slot:', {
              error: oldSlotError,
              query: { teacherId, oldDate, time_slot: dbFormattedOldTime }
            });
            
            // CRITICAL FIX: Don't fail the entire operation if old slot can't be freed
            console.log('⚠️ CRITICAL FIX: Continuing with reschedule despite old slot freeing failure');
            toast.warning('Note: Could not free the old time slot, but the new slot will still be booked.');
          } else {
            console.log('✅ CRITICAL FIX: Old slot freed successfully:', oldSlotData);
          }
        }
      }

      // CRITICAL FIX: Book new slot with standardized time
      console.log('🔒 CRITICAL FIX: Booking new slot with standardized time:', { 
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

      // CRITICAL FIX: Update student/family with enhanced handling
      if (familyGroupId) {
        console.log('👨‍👩‍👧‍👦 CRITICAL FIX: Updating family group with new schedule');
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

        console.log('✅ CRITICAL FIX: Family group and all students updated successfully');
      } else {
        console.log('👤 CRITICAL FIX: Updating individual student');
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

        console.log('✅ CRITICAL FIX: Individual student updated successfully');
      }

      // CRITICAL FIX: Enhanced session update with better error handling
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
            console.log('✅ CRITICAL FIX: Session updated with reschedule information');
          }
        }
      }

      console.log('✅ CRITICAL FIX: Student rescheduled successfully with all enhancements');
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
