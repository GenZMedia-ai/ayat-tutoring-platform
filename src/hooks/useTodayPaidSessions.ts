
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, toZonedTime } from 'date-fns-tz';

const EGYPT_TIMEZONE = 'Africa/Cairo';

interface TodaySession {
  id: string;
  studentId: string;
  studentName: string;
  sessionNumber: number;
  scheduledTime: string;
  status: string;
  totalSessions: number;
  completedSessions: number;
}

export const useTodayPaidSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TodaySession[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTodaySessions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      console.log('🔍 Fetching today\'s paid sessions for teacher:', user.id, 'date:', today);

      const { data: sessionData, error } = await supabase
        .from('sessions')
        .select(`
          id,
          session_number,
          scheduled_time,
          status,
          session_students!inner(
            student_id,
            students!inner(
              id,
              name,
              assigned_teacher_id
            )
          )
        `)
        .eq('scheduled_date', today)
        .eq('session_students.students.assigned_teacher_id', user.id)
        .in('status', ['scheduled'])
        .order('scheduled_time');

      if (error) {
        console.error('❌ Error fetching today\'s sessions:', error);
        return;
      }

      console.log('📋 Raw session data:', sessionData);

      if (!sessionData || sessionData.length === 0) {
        console.log('📅 No sessions found for today');
        setSessions([]);
        return;
      }

      // Process sessions and get progress data
      const processedSessions = await Promise.all(
        sessionData.map(async (session) => {
          const student = session.session_students[0]?.students;
          if (!student) return null;

          // Get total and completed sessions for this student
          const { data: progressData } = await supabase
            .from('sessions')
            .select(`
              id,
              status,
              session_students!inner(student_id)
            `)
            .eq('session_students.student_id', student.id);

          const totalSessions = progressData?.length || 0;
          const completedSessions = progressData?.filter(s => s.status === 'completed').length || 0;

          return {
            id: session.id,
            studentId: student.id,
            studentName: student.name,
            sessionNumber: session.session_number,
            scheduledTime: session.scheduled_time,
            status: session.status,
            totalSessions,
            completedSessions
          };
        })
      );

      const validSessions = processedSessions.filter(Boolean) as TodaySession[];
      console.log('📋 Processed today\'s sessions:', validSessions);
      setSessions(validSessions);
    } catch (error) {
      console.error('❌ Error in fetchTodaySessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaySessions();
  }, [user]);

  return {
    sessions,
    loading,
    refreshSessions: fetchTodaySessions
  };
};
