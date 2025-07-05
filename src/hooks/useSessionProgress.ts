
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

      // Get student data and sessions - same approach as useTeacherActiveStudents
      const [studentResult, sessionResult] = await Promise.all([
        supabase
          .from('students')
          .select('package_session_count, status')
          .eq('id', studentId)
          .single(),
        supabase
          .from('sessions')
          .select(`
            id,
            status,
            trial_outcome,
            session_students!inner(student_id)
          `)
          .eq('session_students.student_id', studentId)
      ]);

      if (studentResult.error) {
        console.error('❌ Error fetching student:', studentResult.error);
        return;
      }

      if (sessionResult.error) {
        console.error('❌ Error fetching sessions:', sessionResult.error);
        return;
      }

      const student = studentResult.data;
      const sessions = sessionResult.data || [];

      // CRITICAL FIX: Separate trial and paid sessions (same logic as useTeacherActiveStudents)
      const paidSessions = sessions.filter(s => s.trial_outcome === null);
      
      // Use package_session_count for total paid sessions (not counting trials)
      const totalPaidSessions = student.package_session_count || 8;
      const completedPaidSessions = paidSessions.filter(s => s.status === 'completed').length;
      
      // Calculate percentage based on paid sessions only
      const completionPercentage = totalPaidSessions > 0 
        ? Math.round((completedPaidSessions / totalPaidSessions) * 100 * 10) / 10
        : 0;

      console.log('📊 Session progress (paid sessions only):', {
        totalPaidSessions,
        completedPaidSessions,
        completionPercentage,
        studentStatus: student.status
      });

      setProgress({
        totalSessions: totalPaidSessions,
        completedSessions: completedPaidSessions,
        studentStatus: student.status,
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
