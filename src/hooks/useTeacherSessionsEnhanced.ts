
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatInEgyptTime } from '@/utils/egyptTimezone';

export interface EnhancedSessionData {
  id: string;
  studentId: string;
  studentName: string;
  sessionNumber: number;
  totalSessions: number;
  completedSessions: number;
  scheduledDate: string;
  scheduledTime: string;
  displayTime: string;
  status: string;
  priority: 'today' | 'upcoming' | 'scheduled';
  isFamily: boolean;
  familyInfo?: {
    parentName: string;
    parentPhone: string;
    totalChildren: number;
    familyId: string;
  };
  platform: string;
  packageName?: string;
  paymentAmount?: number;
  currency?: string;
}

export interface SessionsByDate {
  today: EnhancedSessionData[];
  next7Days: EnhancedSessionData[];
  thisMonth: EnhancedSessionData[];
}

export const useTeacherSessionsEnhanced = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionsByDate>({
    today: [],
    next7Days: [],
    thisMonth: []
  });
  const [loading, setLoading] = useState(false);

  const fetchEnhancedSessions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔍 Fetching enhanced sessions for teacher:', user.id);

      // Get today's date in Egypt timezone
      const today = new Date().toISOString().split('T')[0];
      const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

      // Fetch sessions with proper student filtering for paid/active students only
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
              status,
              family_group_id,
              platform,
              package_name,
              package_session_count,
              payment_amount,
              payment_currency,
              parent_name,
              phone,
              family_groups!fk_students_family_group(
                id,
                parent_name,
                phone,
                student_count
              )
            )
          )
        `)
        .eq('session_students.students.assigned_teacher_id', user.id)
        .in('session_students.students.status', ['paid', 'active'])
        .gte('scheduled_date', today)
        .lte('scheduled_date', thisMonth)
        .in('status', ['scheduled'])
        .order('scheduled_date')
        .order('scheduled_time');

      if (error) {
        console.error('❌ Error fetching enhanced sessions:', error);
        return;
      }

      console.log('📋 Raw enhanced session data:', sessionData);

      if (!sessionData || sessionData.length === 0) {
        console.log('📅 No scheduled sessions found');
        setSessions({ today: [], next7Days: [], thisMonth: [] });
        return;
      }

      // Process sessions and group by date ranges
      const processedSessions = await Promise.all(
        sessionData.map(async (session) => {
          const student = session.session_students[0]?.students;
          if (!student) return null;

          // Fix: Access family_groups correctly from the nested query
          const familyGroup = student.family_groups;

          // Get total completed sessions for this student
          const { data: progressData } = await supabase
            .from('sessions')
            .select(`
              id,
              status,
              session_students!inner(student_id)
            `)
            .eq('session_students.student_id', student.id);

          const totalSessions = student.package_session_count || 8;
          const completedSessions = progressData?.filter(s => s.status === 'completed').length || 0;

          // Determine priority
          const sessionDate = session.scheduled_date;
          let priority: 'today' | 'upcoming' | 'scheduled' = 'scheduled';
          
          if (sessionDate === today) {
            priority = 'today';
          } else if (sessionDate <= next7Days) {
            priority = 'upcoming';
          }

          // Format display time
          const displayTime = formatInEgyptTime(
            `${session.scheduled_date}T${session.scheduled_time}`, 
            'h:mm a'
          );

          const enhancedSession: EnhancedSessionData = {
            id: session.id,
            studentId: student.id,
            studentName: student.name,
            sessionNumber: session.session_number,
            totalSessions,
            completedSessions,
            scheduledDate: session.scheduled_date,
            scheduledTime: session.scheduled_time,
            displayTime,
            status: session.status,
            priority,
            isFamily: !!student.family_group_id,
            familyInfo: familyGroup ? {
              parentName: familyGroup.parent_name,
              parentPhone: familyGroup.phone,
              totalChildren: familyGroup.student_count,
              familyId: familyGroup.id
            } : undefined,
            platform: student.platform,
            packageName: student.package_name,
            paymentAmount: student.payment_amount,
            currency: student.payment_currency || 'USD'
          };

          return enhancedSession;
        })
      );

      const validSessions = processedSessions.filter(Boolean) as EnhancedSessionData[];

      // Group sessions by date ranges
      const groupedSessions: SessionsByDate = {
        today: validSessions.filter(s => s.priority === 'today'),
        next7Days: validSessions.filter(s => s.priority === 'upcoming'),
        thisMonth: validSessions.filter(s => s.priority === 'scheduled')
      };

      console.log('📊 Grouped enhanced sessions:', groupedSessions);
      setSessions(groupedSessions);

    } catch (error) {
      console.error('❌ Error in fetchEnhancedSessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnhancedSessions();
  }, [user]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Setting up real-time updates for enhanced sessions');
    
    const channel = supabase
      .channel('teacher-enhanced-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        (payload) => {
          console.log('🔄 Session update received:', payload);
          fetchEnhancedSessions();
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
          fetchEnhancedSessions();
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up enhanced sessions subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    sessions,
    loading,
    refreshSessions: fetchEnhancedSessions
  };
};
