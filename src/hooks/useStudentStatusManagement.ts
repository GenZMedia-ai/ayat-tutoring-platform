
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStatusValidation } from './useStatusValidation';
import { useAuth } from '@/contexts/AuthContext';

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
    reason: string
  ) => {
    setLoading(true);
    try {
      console.log('🔄 Rescheduling student:', { studentId, newDate, newTime, reason });
      
      // Update student trial date and time
      const { error: studentError } = await supabase
        .from('students')
        .update({ 
          trial_date: newDate.toISOString().split('T')[0],
          trial_time: newTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (studentError) {
        console.error('❌ Error rescheduling student:', studentError);
        toast.error('Failed to reschedule student');
        return false;
      }

      // In a real implementation, we would also:
      // 1. Update teacher availability (free old slot, book new slot)
      // 2. Log the reschedule reason in a reschedule_log table
      // 3. Send notifications to student and sales team
      // 4. Update any related sessions

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
