
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type DateRangeOption = 'today' | 'this-week' | 'next-7-days';

interface SessionItem {
  id: string;
  studentId: string;
  studentName: string;
  sessionNumber: number;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  totalSessions: number;
  completedSessions: number;
  priority?: 'high' | 'medium' | 'low';
  isConsecutive?: boolean;
  sequencePosition?: number;
}

export const useSessionsByDateRange = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeOption>('today');

  const getDateRange = (range: DateRangeOption) => {
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);

    switch (range) {
      case 'today':
        return { start: today.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
      case 'this-week':
        const dayOfWeek = today.getDay();
        startDate.setDate(today.getDate() - dayOfWeek);
        endDate.setDate(today.getDate() + (6 - dayOfWeek));
        return { start: startDate.toISOString().split('T')[0], end: endDate.toISOString().split('T')[0] };
      case 'next-7-days':
        endDate.setDate(today.getDate() + 6);
        return { start: today.toISOString().split('T')[0], end: endDate.toISOString().split('T')[0] };
      default:
        return { start: today.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
    }
  };

  const fetchSessions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { start, end } = getDateRange(dateRange);
      
      console.log('🔍 Fetching sessions for date range:', dateRange, 'from', start, 'to', end);

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
        .gte('scheduled_date', start)
        .lte('scheduled_date', end)
        .eq('session_students.students.assigned_teacher_id', user.id)
        .in('session_students.students.status', ['paid', 'active'])
        .in('status', ['scheduled'])
        .order('scheduled_date')
        .order('scheduled_time');

      if (error) {
        console.error('❌ Error fetching sessions:', error);
        return;
      }

      if (!sessionData || sessionData.length === 0) {
        console.log('📅 No sessions found for date range');
        setSessions([]);
        return;
      }

      // Process sessions and add priority/sequence intelligence
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

          // Determine priority based on session characteristics
          const priority = determinePriority(session, completedSessions, totalSessions);

          return {
            id: session.id,
            studentId: student.id,
            studentName: student.name,
            sessionNumber: session.session_number,
            scheduledDate: session.scheduled_date,
            scheduledTime: session.scheduled_time,
            status: session.status,
            totalSessions,
            completedSessions,
            priority
          };
        })
      );

      const validSessions = processedSessions.filter(Boolean) as SessionItem[];
      
      // Add consecutive session detection
      const enhancedSessions = addConsecutiveSessionInfo(validSessions);
      
      console.log('📋 Processed sessions with enhancements:', enhancedSessions);
      setSessions(enhancedSessions);
    } catch (error) {
      console.error('❌ Error in fetchSessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const determinePriority = (session: any, completed: number, total: number): 'high' | 'medium' | 'low' => {
    // First session gets high priority
    if (session.session_number === 1) return 'high';
    
    // Sessions close to completion get high priority
    if (completed / total > 0.8) return 'high';
    
    // Sessions scheduled today get medium priority
    const today = new Date().toISOString().split('T')[0];
    if (session.scheduled_date === today) return 'medium';
    
    return 'low';
  };

  const addConsecutiveSessionInfo = (sessions: SessionItem[]): SessionItem[] => {
    const studentGroups = sessions.reduce((acc, session) => {
      if (!acc[session.studentId]) {
        acc[session.studentId] = [];
      }
      acc[session.studentId].push(session);
      return acc;
    }, {} as Record<string, SessionItem[]>);

    return sessions.map(session => {
      const studentSessions = studentGroups[session.studentId];
      if (studentSessions.length > 1) {
        const sortedSessions = studentSessions.sort((a, b) => 
          new Date(a.scheduledDate + ' ' + a.scheduledTime).getTime() - 
          new Date(b.scheduledDate + ' ' + b.scheduledTime).getTime()
        );
        const position = sortedSessions.findIndex(s => s.id === session.id);
        return {
          ...session,
          isConsecutive: true,
          sequencePosition: position + 1
        };
      }
      return session;
    });
  };

  useEffect(() => {
    fetchSessions();
  }, [user, dateRange]);

  return {
    sessions,
    loading,
    dateRange,
    setDateRange,
    refreshSessions: fetchSessions
  };
};
