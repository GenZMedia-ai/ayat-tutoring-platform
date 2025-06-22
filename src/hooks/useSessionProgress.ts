
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SessionProgress {
  totalSessions: number;
  completedSessions: number;
  studentStatus: string;
  completionPercentage: number;
}

export const useSessionProgress = (studentId: string) => {
  const [progress, setProgress] = useState<SessionProgress | null>(null);
  const [loading, setLoading] = useState(false);

  const checkProgress = async () => {
    if (!studentId) return;

    setLoading(true);
    try {
      console.log('🔍 Checking session progress for student:', studentId);

      const { data, error } = await supabase.rpc('check_subscription_completion', {
        p_student_id: studentId
      });

      if (error) {
        console.error('❌ Error checking progress:', error);
        return;
      }

      console.log('📊 Session progress:', data);

      setProgress({
        totalSessions: data.total_sessions,
        completedSessions: data.completed_sessions,
        studentStatus: data.student_status,
        completionPercentage: data.completion_percentage
      });
    } catch (error) {
      console.error('❌ Error in checkProgress:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkProgress();
  }, [studentId]);

  return {
    progress,
    loading,
    refreshProgress: checkProgress
  };
};
