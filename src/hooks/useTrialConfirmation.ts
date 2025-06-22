
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConfirmTrialResponse {
  success: boolean;
  student_id?: string;
  message?: string;
}

export const useTrialConfirmation = () => {
  const [loading, setLoading] = useState(false);

  const confirmTrial = async (studentId: string) => {
    setLoading(true);
    try {
      console.log('✅ Confirming trial for student:', studentId);
      
      const { data, error } = await supabase.rpc('confirm_trial', {
        p_student_id: studentId
      });

      if (error) {
        console.error('❌ Error confirming trial:', error);
        toast.error('Failed to confirm trial');
        return false;
      }

      const response = data as ConfirmTrialResponse;

      if (!response.success) {
        console.error('❌ Trial confirmation failed:', response.message);
        toast.error(response.message || 'Failed to confirm trial');
        return false;
      }

      console.log('✅ Trial confirmed successfully:', response);
      toast.success('Trial confirmed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error in confirmTrial:', error);
      toast.error('Failed to confirm trial');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    confirmTrial
  };
};
