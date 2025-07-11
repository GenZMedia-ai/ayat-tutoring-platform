
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type DateRange = 'today' | 'next-7-days' | 'this-month';

interface SessionsByDateRange {
  id: string;
  studentId: string;
  studentName: string;
  sessionNumber: number;
  scheduledTime: string;
  scheduledDate: string;
  status: string;
  totalSessions: number;
  completedSessions: number;
}

export const useSessionsByDateRange = (dateRange: DateRange) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionsByDateRange[]>([]);
  const [loading, setLoading] = useState(false);

  const getDateRangeFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date(today);

    switch (dateRange) {
      case 'today':
        return { startDate: today, endDate: today };
      case 'next-7-days':
        const next7Days = new Date(todayDate);
        next7Days.setDate(todayDate.getDate() + 7);
        return { 
          startDate: today, 
          endDate: next7Days.toISOString().split('T')[0] 
        };
      case 'this-month':
        const startOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
        const endOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);
        return { 
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0]
        };
      default:
        return { startDate: today, endDate: today };
    }
  };

  const fetchSessions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { startDate, endDate } = getDateRangeFilter();
      
      console.log(`🔍 Fetching ${dateRange} PAID sessions for teacher:`, user.id, 'date range:', startDate, 'to', endDate);

      const { data: sessionData, error } = await supabase
        .from('sessions')
        .select(`
          id,
          session_number,
          scheduled_date,
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
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .eq('session_students.students.assigned_teacher_id', user.id)
        .in('session_students.students.status', ['paid', 'active'])
        .in('status', ['scheduled'])
        .order('scheduled_date')
        .order('scheduled_time');

      if (error) {
        console.error(`❌ Error fetching ${dateRange} paid sessions:`, error);
        return;
      }

      console.log(`📋 Raw ${dateRange} session data:`, sessionData);

      if (!sessionData || sessionData.length === 0) {
        console.log(`📅 No paid sessions found for ${dateRange}`);
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
            scheduledDate: session.scheduled_date,
            status: session.status,
            totalSessions,
            completedSessions
          };
        })
      );

      const validSessions = processedSessions.filter(Boolean) as SessionsByDateRange[];
      console.log(`📋 Processed ${dateRange} PAID sessions:`, validSessions);
      setSessions(validSessions);
    } catch (error) {
      console.error(`❌ Error in fetch${dateRange}Sessions:`, error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSessions = () => {
    fetchSessions();
  };

  useEffect(() => {
    fetchSessions();
  }, [user, dateRange]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    console.log(`🔄 Setting up real-time updates for ${dateRange} paid sessions`);
    
    const channel = supabase
      .channel(`teacher-${dateRange}-paid-sessions`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        (payload) => {
          console.log(`🔄 ${dateRange} session update received:`, payload);
          fetchSessions();
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
          console.log(`🔄 ${dateRange} session students update received:`, payload);
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      console.log(`🔄 Cleaning up ${dateRange} real-time subscription`);
      supabase.removeChannel(channel);
    };
  }, [user, dateRange]);

  return {
    sessions,
    loading,
    refreshSessions
  };
};
