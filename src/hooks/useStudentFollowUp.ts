
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FollowUpData {
  id: string;
  studentId: string;
  scheduledDate: string;
  reason: string;
  notes?: string;
  completed: boolean;
  notificationSent: boolean;
}

export const useStudentFollowUp = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const scheduleFollowUp = async (
    studentId: string,
    scheduledDate: Date,
    reason: string,
    notes?: string
  ) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      // Convert to UTC for storage
      const utcDate = new Date(scheduledDate.toISOString());
      
      const { data, error } = await supabase.rpc('schedule_student_followup', {
        p_student_id: studentId,
        p_sales_agent_id: user.id,
        p_scheduled_date_utc: utcDate.toISOString(),
        p_reason: reason,
        p_notes: notes
      });
      
      if (error) throw error;
      
      console.log('✅ Follow-up scheduled successfully:', data);
      toast.success('Follow-up scheduled successfully');
      
      return data;
    } catch (error: any) {
      console.error('❌ Failed to schedule follow-up:', error);
      toast.error(error.message || 'Failed to schedule follow-up');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeFollowUp = async (
    followUpId: string,
    outcome: 'awaiting-payment' | 'paid' | 'dropped',
    notes?: string
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('complete_student_followup', {
        p_followup_id: followUpId,
        p_outcome: outcome,
        p_notes: notes
      });
      
      if (error) throw error;
      
      console.log('✅ Follow-up completed successfully:', data);
      toast.success(`Follow-up completed - Status: ${outcome}`);
      
      return data;
    } catch (error: any) {
      console.error('❌ Failed to complete follow-up:', error);
      toast.error(error.message || 'Failed to complete follow-up');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getFollowUpData = async (studentId: string): Promise<FollowUpData | null> => {
    try {
      const { data, error } = await supabase
        .from('sales_followups')
        .select('*')
        .eq('student_id', studentId)
        .eq('completed', false)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) return null;
      
      return {
        id: data.id,
        studentId: data.student_id,
        scheduledDate: data.scheduled_date,
        reason: data.reason,
        notes: data.notes,
        completed: data.completed,
        notificationSent: data.notification_sent
      };
    } catch (error) {
      console.error('❌ Failed to get follow-up data:', error);
      return null;
    }
  };

  return {
    scheduleFollowUp,
    completeFollowUp,
    getFollowUpData,
    loading
  };
};
