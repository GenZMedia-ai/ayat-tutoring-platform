
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SessionProgress {
  totalSessions: number;
  completedSessions: number;
  studentStatus: string;
  completionPercentage: number;
}

interface ProgressResult {
  total_sessions: number;
  completed_sessions: number;
  student_status: string;
  completion_percentage: number;
}

export const useSessionProgress = (studentId: string) => {
  const [progress, setProgress] = useState<SessionProgress | null>(null);
  const [loading, setLoading] = useState(false);

  const checkProgress = async () => {
    if (!studentId) return;

    setLoading(true);
    try {
      console.log('🔍 Checking session progress for student:', studentId);

      // Get session progress excluding trial sessions (session_number = 1)
      const { data: progressData, error } = await supabase
        .from('sessions')
        .select(`
          id,
          status,
          session_number,
          session_students!inner(student_id)
        `)
        .eq('session_students.student_id', studentId)
        .gt('session_number', 1); // Exclude trial sessions

      if (error) {
        console.error('❌ Error fetching progress data:', error);
        return;
      }

      const totalSessions = progressData?.length || 0;
      const completedSessions = progressData?.filter(s => s.status === 'completed').length || 0;
      
      // Get current student status
      const { data: studentData } = await supabase
        .from('students')
        .select('status')
        .eq('id', studentId)
        .single();

      const completionPercentage = totalSessions > 0 
        ? Math.round((completedSessions / totalSessions) * 100) 
        : 0;

      console.log('📊 Session progress:', { totalSessions, completedSessions, completionPercentage });

      setProgress({
        totalSessions,
        completedSessions,
        studentStatus: studentData?.status || 'unknown',
        completionPercentage
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
