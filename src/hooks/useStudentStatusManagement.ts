
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useStudentStatusManagement = () => {
  const [loading, setLoading] = useState(false);

  const updateStudentStatus = async (studentId: string, newStatus: string) => {
    setLoading(true);
    try {
      console.log('🔄 Updating student status:', studentId, 'to', newStatus);
      
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
        'pending': 'pending'
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
      console.log('🔄 Rescheduling student:', studentId, 'to', newDate, newTime);
      
      const { error } = await supabase
        .from('students')
        .update({ 
          trial_date: newDate.toISOString().split('T')[0],
          trial_time: newTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) {
        console.error('❌ Error rescheduling student:', error);
        toast.error('Failed to reschedule student');
        return false;
      }

      // In a full implementation, we would also:
      // 1. Update teacher availability (free old slot, book new slot)
      // 2. Log the reschedule reason
      // 3. Send notifications

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

  return {
    loading,
    updateStudentStatus,
    rescheduleStudent
  };
};
