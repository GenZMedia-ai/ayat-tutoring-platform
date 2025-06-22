
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSessionCompletion = () => {
  const [loading, setLoading] = useState(false);

  const completeSession = async (
    sessionId: string, 
    actualMinutes: number, 
    learningNotes: string, 
    attendanceConfirmed: boolean = true
  ) => {
    setLoading(true);
    try {
      console.log('🔄 Completing session:', sessionId, 'with details:', {
        actualMinutes,
        learningNotes,
        attendanceConfirmed
      });

      const { data, error } = await supabase.rpc('complete_session_with_details', {
        p_session_id: sessionId,
        p_actual_minutes: actualMinutes,
        p_learning_notes: learningNotes,
        p_attendance_confirmed: attendanceConfirmed
      });

      if (error) {
        console.error('❌ Error completing session:', error);
        toast.error('Failed to complete session');
        return false;
      }

      console.log('✅ Session completed successfully:', data);
      
      if (data.subscription_completed) {
        toast.success('Session completed! Student subscription has ended - renewal needed');
      } else {
        toast.success('Session completed successfully');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error in completeSession:', error);
      toast.error('Failed to complete session');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    completeSession,
    loading
  };
};
