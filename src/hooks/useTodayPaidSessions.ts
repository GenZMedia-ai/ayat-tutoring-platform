
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
      
      console.log('🔍 Fetching today\'s PAID sessions only for teacher:', user.id, 'date:', today);

      // Enhanced query to exclude trial sessions - only get sessions for students who have moved beyond trial phase
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
              assigned_teacher_id,
              status
            )
          )
        `)
        .eq('scheduled_date', today)
        .eq('session_students.students.assigned_teacher_id', user.id)
        .in('status', ['scheduled'])
        // Critical fix: Only include students who are in paid status (not pending/trial)
        .in('session_students.students.status', ['paid', 'active', 'completed'])
        .order('scheduled_time');

      if (error) {
        console.error('❌ Error fetching today\'s paid sessions:', error);
        return;
      }

      console.log('📋 Raw paid session data (excluding trials):', sessionData);

      if (!sessionData || sessionData.length === 0) {
        console.log('📅 No paid sessions found for today');
        setSessions([]);
        return;
      }

      // Process sessions and get progress data
      const processedSessions = await Promise.all(
        sessionData.map(async (session) => {
          const student = session.session_students[0]?.students;
          if (!student) return null;

          // Additional check to ensure this is truly a paid student
          if (['pending', 'confirmed', 'trial-completed', 'trial-ghosted'].includes(student.status)) {
            console.log('🚫 Excluding trial/pending student:', student.name, 'status:', student.status);
            return null;
          }

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
      console.log('📋 Final processed PAID sessions (trials excluded):', validSessions);
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

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Setting up real-time updates for today\'s paid sessions');
    
    const channel = supabase
      .channel('teacher-today-paid-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        (payload) => {
          console.log('🔄 Session update received:', payload);
          fetchTodaySessions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_students'
        },
        (payload) => {
          console.log('🔄 Session students update received:', payload);
          fetchTodaySessions();
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    sessions,
    loading,
    refreshSessions: fetchTodaySessions
  };
};
