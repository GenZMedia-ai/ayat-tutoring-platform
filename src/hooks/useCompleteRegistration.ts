
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SessionData {
  sessionNumber: number;
  date: string;
  time: string;
}

interface RegistrationResult {
  success: boolean;
  sessions_created: number;
  student_status: string;
  message: string;
}

export const useCompleteRegistration = () => {
  const [loading, setLoading] = useState(false);

  const completeRegistration = async (studentId: string, sessions: SessionData[]) => {
    setLoading(true);
    try {
      console.log('🔄 Completing registration for student:', studentId, 'with sessions:', sessions);

      const sessionData = sessions.map(session => ({
        session_number: session.sessionNumber,
        date: session.date,
        time: session.time
      }));

      const { data, error } = await supabase.rpc('complete_student_registration', {
        p_student_id: studentId,
        p_session_data: sessionData
      });

      if (error) {
        console.error('❌ Error completing registration:', error);
        toast.error('Failed to complete registration');
        return false;
      }

      console.log('✅ Registration completed successfully:', data);
      const result = data as unknown as RegistrationResult;
      toast.success(`Registration completed! ${result.sessions_created} sessions scheduled`);
      return true;
    } catch (error) {
      console.error('❌ Error in completeRegistration:', error);
      toast.error('Failed to complete registration');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    completeRegistration,
    loading
  };
};
