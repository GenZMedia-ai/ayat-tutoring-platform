
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const EGYPT_TIMEZONE = 'Africa/Cairo';

interface TeacherScheduledSession {
  id: string;
  sessionNumber: number;
  scheduledDate: string;
  scheduledTime: string;
  egyptTime: string;
  status: string;
  student: {
    id: string;
    name: string;
    age: number;
    phone: string;
    platform: string;
    packageSessionCount: number;
    isFamily: boolean;
    familyInfo?: {
      parentName: string;
      totalStudents: number;
      familyMembers: string[];
    };
  };
  progress: {
    totalSessions: number;
    completedSessions: number;
    percentage: number;
  };
  priority: 'urgent' | 'today' | 'upcoming' | 'normal';
}

type DateRange = 'today' | 'next-7-days' | 'this-month';

export const useTeacherScheduledSessions = (dateRange: DateRange) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TeacherScheduledSession[]>([]);
  const [loading, setLoading] = useState(false);

  const getDateFilter = () => {
    const today = new Date();
    const egyptToday = toZonedTime(today, EGYPT_TIMEZONE);
    const todayStr = format(egyptToday, 'yyyy-MM-dd');

    switch (dateRange) {
      case 'today':
        return { startDate: todayStr, endDate: todayStr };
      case 'next-7-days':
        const next7Days = new Date(egyptToday);
        next7Days.setDate(egyptToday.getDate() + 7);
        return { 
          startDate: todayStr, 
          endDate: format(next7Days, 'yyyy-MM-dd')
        };
      case 'this-month':
        const startOfMonth = new Date(egyptToday.getFullYear(), egyptToday.getMonth(), 1);
        const endOfMonth = new Date(egyptToday.getFullYear(), egyptToday.getMonth() + 1, 0);
        return {
          startDate: format(startOfMonth, 'yyyy-MM-dd'),
          endDate: format(endOfMonth, 'yyyy-MM-dd')
        };
    }
  };

  const calculatePriority = (scheduledDate: string, scheduledTime: string): 'urgent' | 'today' | 'upcoming' | 'normal' => {
    const today = format(toZonedTime(new Date(), EGYPT_TIMEZONE), 'yyyy-MM-dd');
    const sessionDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    const hoursUntil = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (scheduledDate === today && hoursUntil <= 2) return 'urgent';
    if (scheduledDate === today) return 'today';
    if (hoursUntil <= 24) return 'upcoming';
    return 'normal';
  };

  const fetchSessions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { startDate, endDate } = getDateFilter();
      
      console.log(`🔍 Fetching ${dateRange} scheduled sessions for teacher:`, user.id);

      // Get sessions for paid/active students only
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
              age,
              phone,
              platform,
              package_session_count,
              parent_name,
              family_group_id,
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
        console.error(`❌ Error fetching ${dateRange} sessions:`, error);
        return;
      }

      if (!sessionData?.length) {
        console.log(`📅 No scheduled sessions found for ${dateRange}`);
        setSessions([]);
        return;
      }

      // Process sessions with family grouping
      const processedSessions = await Promise.all(
        sessionData.map(async (session) => {
          const student = session.session_students[0]?.students;
          if (!student) return null;

          // Get session progress
          const { data: progressData } = await supabase
            .from('sessions')
            .select('id, status, session_students!inner(student_id)')
            .eq('session_students.student_id', student.id);

          const totalSessions = progressData?.length || 0;
          const completedSessions = progressData?.filter(s => s.status === 'completed').length || 0;

          // Handle family information
          let familyInfo = undefined;
          if (student.family_group_id) {
            const { data: familyData } = await supabase
              .from('students')
              .select('name')
              .eq('family_group_id', student.family_group_id);

            familyInfo = {
              parentName: student.parent_name || 'Parent',
              totalStudents: familyData?.length || 1,
              familyMembers: familyData?.map(s => s.name) || [student.name]
            };
          }

          // Convert time to Egypt timezone with AM/PM
          const utcDateTime = new Date(`${session.scheduled_date}T${session.scheduled_time}Z`);
          const egyptDateTime = toZonedTime(utcDateTime, EGYPT_TIMEZONE);
          const egyptTimeFormatted = format(egyptDateTime, 'h:mm a');

          const processedSession: TeacherScheduledSession = {
            id: session.id,
            sessionNumber: session.session_number,
            scheduledDate: session.scheduled_date,
            scheduledTime: session.scheduled_time,
            egyptTime: egyptTimeFormatted,
            status: session.status,
            student: {
              id: student.id,
              name: student.name,
              age: student.age,
              phone: student.phone,
              platform: student.platform,
              packageSessionCount: student.package_session_count || 8,
              isFamily: !!student.family_group_id,
              familyInfo
            },
            progress: {
              totalSessions,
              completedSessions,
              percentage: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
            },
            priority: calculatePriority(session.scheduled_date, session.scheduled_time)
          };

          return processedSession;
        })
      );

      const validSessions = processedSessions.filter(Boolean) as TeacherScheduledSession[];
      
      // Sort by priority and time
      validSessions.sort((a, b) => {
        const priorityOrder = { urgent: 0, today: 1, upcoming: 2, normal: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(`${a.scheduledDate}T${a.scheduledTime}`).getTime() - 
               new Date(`${b.scheduledDate}T${b.scheduledTime}`).getTime();
      });

      console.log(`📋 Processed ${dateRange} sessions:`, validSessions);
      setSessions(validSessions);

    } catch (error) {
      console.error(`❌ Error in fetch${dateRange}Sessions:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user, dateRange]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`teacher-scheduled-sessions-${dateRange}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, fetchSessions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_students' }, fetchSessions)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, dateRange]);

  return {
    sessions,
    loading,
    refreshSessions: fetchSessions
  };
};
