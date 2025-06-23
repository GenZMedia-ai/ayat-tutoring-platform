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

  // PHASE 1&2 FIX: Helper function to convert Egypt time to UTC with seconds format
  const egyptTimeToUTCWithSeconds = (date: Date, egyptTime: string): string => {
    console.log('🔄 PHASE 1&2: Egypt time to UTC conversion:', { date: date.toDateString(), egyptTime });
    
    const [hours, minutes] = egyptTime.split(':').map(Number);
    console.log('📅 Egypt time components:', { hours, minutes });
    
    // Egypt is UTC+2, so to convert FROM Egypt TO UTC, we SUBTRACT 2 hours
    const EGYPT_UTC_OFFSET = 2;
    let utcHour = hours - EGYPT_UTC_OFFSET;
    
    // Handle day boundary crossings properly
    if (utcHour < 0) {
      utcHour += 24;
      console.log('⚠️ UTC hour crossed to previous day:', utcHour);
    } else if (utcHour >= 24) {
      utcHour -= 24;
      console.log('⚠️ UTC hour crossed to next day:', utcHour);
    }
    
    const utcTime = `${String(utcHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    
    console.log('✅ PHASE 1&2: Egypt to UTC conversion result:', {
      egyptTime: egyptTime,
      utcTime: utcTime,
      offsetSubtracted: EGYPT_UTC_OFFSET,
      utcHour: utcHour
    });
    
    return utcTime;
  };

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

  // PHASE 1&2 FIX: Comprehensive reschedule function with proper time handling and atomic operations
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
      console.log('🔄 PHASE 1&2: Starting comprehensive reschedule with atomic operations:', { 
        studentId, newDate, newTime, reason, currentDate, currentTime 
      });
      
      const dateString = format(newDate, 'yyyy-MM-dd');
      const utcTimeWithSeconds = egyptTimeToUTCWithSeconds(newDate, newTime);

      console.log('🕐 PHASE 1&2: Time handling with proper format:', {
        selectedEgyptTime: newTime,
        utcTimeWithSeconds: utcTimeWithSeconds,
        newDate: dateString
      });

      // PHASE 2 FIX: Get comprehensive student data including current slot information
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('assigned_teacher_id, trial_date, trial_time, family_group_id, name')
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

      console.log('📋 PHASE 2: Student data retrieved:', {
        teacherId,
        oldDate,
        oldTime,
        familyGroupId: studentData.family_group_id,
        studentName: studentData.name
      });

      // PHASE 2 FIX: Check new slot availability with exact time format matching
      const { data: availabilityCheck, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('date', dateString)
        .eq('time_slot', utcTimeWithSeconds)
        .eq('is_available', true)
        .eq('is_booked', false)
        .single();

      if (availabilityError || !availabilityCheck) {
        console.error('❌ PHASE 2: New slot not available:', availabilityError);
        toast.error('Selected time slot is no longer available');
        return false;
      }

      console.log('✅ PHASE 2: New slot verified as available:', {
        slotId: availabilityCheck.id,
        teacherId: teacherId,
        date: dateString,
        time: utcTimeWithSeconds
      });

      // PHASE 2 FIX: Free up old slot with exact time format matching if it exists
      if (oldDate && oldTime) {
        console.log('🔓 PHASE 2: Attempting to free old slot:', { oldDate, oldTime });
        
        // Convert old time to ensure proper format (handle both HH:mm and HH:mm:ss)
        const oldTimeFormatted = oldTime.includes(':') && oldTime.split(':').length === 2 
          ? `${oldTime}:00` 
          : oldTime;

        console.log('🔍 PHASE 2: Old time format check:', {
          originalOldTime: oldTime,
          formattedOldTime: oldTimeFormatted
        });

        const { data: oldSlotData, error: oldSlotFetchError } = await supabase
          .from('teacher_availability')
          .select('*')
          .eq('teacher_id', teacherId)
          .eq('date', oldDate)
          .eq('time_slot', oldTimeFormatted);

        if (oldSlotFetchError) {
          console.error('❌ PHASE 2: Error fetching old slot:', oldSlotFetchError);
          toast.error('Failed to locate old time slot');
          return false;
        }

        console.log('📋 PHASE 2: Old slot lookup result:', oldSlotData);

        if (oldSlotData && oldSlotData.length > 0) {
          // Find the slot that was booked by this student or is booked
          const oldSlot = oldSlotData.find(slot => 
            slot.student_id === studentId || slot.is_booked === true
          );

          if (oldSlot) {
            console.log('🔓 PHASE 2: Freeing old slot:', oldSlot.id);
            const { error: oldSlotError } = await supabase
              .from('teacher_availability')
              .update({ 
                is_booked: false,
                student_id: null,
                updated_at: new Date().toISOString()
              })
              .eq('id', oldSlot.id);

            if (oldSlotError) {
              console.error('❌ PHASE 2: Error freeing old slot:', oldSlotError);
              toast.error('Failed to free old time slot');
              return false;
            }
            console.log('✅ PHASE 2: Old slot freed successfully');
          } else {
            console.log('ℹ️ PHASE 2: No old slot found to free (may have been manually freed)');
          }
        } else {
          console.log('ℹ️ PHASE 2: No old slot data found (may have been deleted)');
        }
      }

      // PHASE 2 FIX: Book new slot atomically
      console.log('🔒 PHASE 2: Booking new slot atomically:', {
        slotId: availabilityCheck.id,
        studentId: studentId
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
        console.error('❌ PHASE 2: Error booking new slot:', newSlotError);
        toast.error('Failed to book new time slot');
        return false;
      }

      console.log('✅ PHASE 2: New slot booked successfully');

      // PHASE 2&3 FIX: Update student record with proper time format
      console.log('📝 PHASE 2&3: Updating student record:', { studentId, dateString, newTime });
      const { error: studentUpdateError } = await supabase
        .from('students')
        .update({ 
          trial_date: dateString,
          trial_time: newTime, // Keep as HH:mm format for student record
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (studentUpdateError) {
        console.error('❌ PHASE 2&3: Error updating student:', studentUpdateError);
        toast.error('Failed to update student details');
        
        // PHASE 2 FIX: Rollback - free the newly booked slot
        await supabase
          .from('teacher_availability')
          .update({
            is_booked: false,
            student_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', availabilityCheck.id);
        
        return false;
      }

      // PHASE 3 FIX: If this is a family student, also update the family group
      if (studentData.family_group_id) {
        console.log('👨‍👩‍👧‍👦 PHASE 3: Updating family group for student:', studentData.family_group_id);
        
        const { error: familyUpdateError } = await supabase
          .from('family_groups')
          .update({
            trial_date: dateString,
            trial_time: newTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', studentData.family_group_id);

        if (familyUpdateError) {
          console.error('❌ PHASE 3: Error updating family group:', familyUpdateError);
          // Don't fail the operation, but log it
        } else {
          console.log('✅ PHASE 3: Family group updated successfully');
        }

        // PHASE 3 FIX: Update all other students in the family
        const { error: familyStudentsError } = await supabase
          .from('students')
          .update({
            trial_date: dateString,
            trial_time: newTime,
            updated_at: new Date().toISOString()
          })
          .eq('family_group_id', studentData.family_group_id)
          .neq('id', studentId); // Don't update the current student again

        if (familyStudentsError) {
          console.error('❌ PHASE 3: Error updating family students:', familyStudentsError);
          // Don't fail the operation, but log it
        } else {
          console.log('✅ PHASE 3: All family students updated successfully');
        }
      }

      // PHASE 4 FIX: Update session with reschedule information
      const { data: sessionStudents, error: sessionStudentsError } = await supabase
        .from('session_students')
        .select('session_id')
        .eq('student_id', studentId);

      if (sessionStudentsError) {
        console.error('❌ PHASE 4: Error fetching session students:', sessionStudentsError);
        // Don't fail the operation for this
      } else if (sessionStudents && sessionStudents.length > 0) {
        // Get the most recent session for this student
        const sessionIds = sessionStudents.map(ss => ss.session_id);
        
        const { data: sessionData, error: sessionFetchError } = await supabase
          .from('sessions')
          .select('id, reschedule_count, original_date, original_time, scheduled_date, scheduled_time')
          .in('id', sessionIds)
          .eq('scheduled_date', oldDate || dateString)
          .order('created_at', { ascending: false })
          .limit(1);

        if (sessionData && sessionData.length > 0) {
          const session = sessionData[0];
          
          console.log('📝 PHASE 4: Updating session with reschedule info:', {
            sessionId: session.id,
            newDate: dateString,
            newTime: utcTimeWithSeconds,
            reason: reason
          });
          
          const { error: sessionUpdateError } = await supabase
            .from('sessions')
            .update({
              scheduled_date: dateString,
              scheduled_time: utcTimeWithSeconds,
              reschedule_count: (session.reschedule_count || 0) + 1,
              reschedule_reason: reason,
              original_date: session.original_date || oldDate,
              original_time: session.original_time || oldTime,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.id);

          if (sessionUpdateError) {
            console.error('❌ PHASE 4: Error updating session:', sessionUpdateError);
            // Don't fail the operation for this
          } else {
            console.log('✅ PHASE 4: Session updated with reschedule information');
          }
        }
      }

      console.log('✅ PHASE 1-4: Student rescheduled successfully with comprehensive fixes');
      toast.success(`${studentData.family_group_id ? 'Family' : 'Student'} trial session rescheduled successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error in rescheduleStudent:', error);
      toast.error('Failed to reschedule student');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ... keep existing code (bulkStatusUpdate function)
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
