
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
      // FIXED: Use Egypt timezone for date calculation
      const egyptNow = new Date(new Date().toLocaleString("en-US", {timeZone: "Africa/Cairo"}));
      const today = egyptNow.toISOString().split('T')[0];
      
      console.log('🔍 FIXED: Fetching today\'s PAID sessions with enhanced filtering:', { 
        teacherId: user.id, 
        egyptDate: today,
        originalDate: new Date().toISOString().split('T')[0]
      });

      // FIXED: Enhanced query with broader student status filtering and better error handling
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
        .in('session_students.students.status', ['paid', 'active']) // FIXED: Include both paid and active
        .in('status', ['scheduled', 'confirmed']) // FIXED: Include confirmed sessions too
        .order('scheduled_time');

      if (error) {
        console.error('❌ FIXED: Error fetching today\'s paid sessions:', error);
        
        // FIXED: Fallback query with relaxed constraints
        console.log('🔄 FIXED: Trying fallback query with relaxed constraints');
        const { data: fallbackData, error: fallbackError } = await supabase
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
          .eq('session_students.students.assigned_teacher_id', user.id)
          .in('session_students.students.status', ['paid', 'active'])
          .gte('scheduled_date', today)
          .lte('scheduled_date', today)
          .order('scheduled_time');

        if (fallbackError) {
          console.error('❌ FIXED: Fallback query also failed:', fallbackError);
          setSessions([]);
          return;
        }
        
        console.log('✅ FIXED: Fallback query successful:', fallbackData?.length || 0);
        // Use fallback data if available
        if (fallbackData && fallbackData.length > 0) {
          await processSessions(fallbackData);
        } else {
          setSessions([]);
        }
        return;
      }

      console.log('📋 FIXED: Raw paid session data:', sessionData?.length || 0);

      if (!sessionData || sessionData.length === 0) {
        console.log('📅 FIXED: No paid sessions found for today, trying broader search');
        
        // FIXED: Try searching with a broader date range
        const tomorrow = new Date(egyptNow);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const { data: broaderData } = await supabase
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
          .eq('session_students.students.assigned_teacher_id', user.id)
          .in('session_students.students.status', ['paid', 'active'])
          .gte('scheduled_date', today)
          .lte('scheduled_date', tomorrowStr)
          .order('scheduled_time');

        console.log('📋 FIXED: Broader search results:', broaderData?.length || 0);
        
        if (broaderData && broaderData.length > 0) {
          await processSessions(broaderData);
        } else {
          setSessions([]);
        }
        return;
      }

      await processSessions(sessionData);
    } catch (error) {
      console.error('❌ FIXED: Error in fetchTodaySessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const processSessions = async (sessionData: any[]) => {
    // FIXED: Process sessions and get progress data with better error handling
    const processedSessions = await Promise.all(
      sessionData.map(async (session) => {
        const student = session.session_students[0]?.students;
        if (!student) return null;

        try {
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
        } catch (error) {
          console.error('❌ FIXED: Error processing session:', error);
          return {
            id: session.id,
            studentId: student.id,
            studentName: student.name,
            sessionNumber: session.session_number,
            scheduledTime: session.scheduled_time,
            status: session.status,
            totalSessions: 0,
            completedSessions: 0
          };
        }
      })
    );

    const validSessions = processedSessions.filter(Boolean) as TodaySession[];
    console.log('📋 FIXED: Processed today\'s PAID sessions:', validSessions.length);
    setSessions(validSessions);
  };

  useEffect(() => {
    fetchTodaySessions();
  }, [user]);

  // FIXED: Enhanced real-time updates with better error handling
  useEffect(() => {
    if (!user) return;

    console.log('🔄 FIXED: Setting up real-time updates for today\'s paid sessions');
    
    const channel = supabase
      .channel('teacher-today-paid-sessions-fixed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        (payload) => {
          console.log('🔄 FIXED: Session update received:', payload);
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
          console.log('🔄 FIXED: Session students update received:', payload);
          fetchTodaySessions();
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 FIXED: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    sessions,
    loading,
    refreshSessions: fetchTodaySessions
  };
};
