
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DateRange } from '@/components/teacher/DateFilter';

interface TeacherStats {
  currentCapacity: number;
  pendingTrials: number;
  confirmedTrials: number;
  completedTrials: number;
  rescheduledTrials: number;
  ghostedTrials: number;
}

export const useTeacherStatistics = (dateRange: DateRange = 'today') => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TeacherStats>({
    currentCapacity: 0,
    pendingTrials: 0,
    confirmedTrials: 0,
    completedTrials: 0,
    rescheduledTrials: 0,
    ghostedTrials: 0
  });
  const [loading, setLoading] = useState(false);

  const getDateFilter = (range: DateRange) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    switch (range) {
      case 'today':
        return { start: today, end: today };
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        return { start: yesterdayStr, end: yesterdayStr };
      case 'last-7-days':
        const week = new Date(now);
        week.setDate(week.getDate() - 7);
        return { start: week.toISOString().split('T')[0], end: today };
      case 'this-month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart.toISOString().split('T')[0], end: today };
      case 'last-month':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return { 
          start: lastMonthStart.toISOString().split('T')[0], 
          end: lastMonthEnd.toISOString().split('T')[0] 
        };
      default:
        return { start: '1970-01-01', end: today };
    }
  };

  const fetchStatistics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { start, end } = getDateFilter(dateRange);
      
      console.log('🔍 Fetching teacher statistics:', { teacherId: user.id, dateRange, start, end });

      // Fetch trial statistics from students table
      const { data: trialStats, error: trialError } = await supabase
        .from('students')
        .select('status, trial_date')
        .eq('assigned_teacher_id', user.id)
        .gte('trial_date', start)
        .lte('trial_date', end);

      if (trialError) {
        console.error('❌ Error fetching trial stats:', trialError);
        return;
      }

      // Fetch current capacity (active students)
      const { data: capacityData, error: capacityError } = await supabase
        .from('students')
        .select('id')
        .eq('assigned_teacher_id', user.id)
        .eq('status', 'active');

      if (capacityError) {
        console.error('❌ Error fetching capacity:', capacityError);
        return;
      }

      // Fetch reschedule statistics from sessions table
      const { data: rescheduledSessions, error: rescheduledError } = await supabase
        .from('sessions')
        .select('id, reschedule_count, session_students!inner(student_id)')
        .gte('scheduled_date', start)
        .lte('scheduled_date', end)
        .gt('reschedule_count', 0);

      if (rescheduledError) {
        console.error('❌ Error fetching rescheduled sessions:', rescheduledError);
      }

      // Filter rescheduled sessions for this teacher's students
      let rescheduledCount = 0;
      if (rescheduledSessions) {
        const teacherStudentIds = trialStats?.map(s => s.id) || [];
        rescheduledCount = rescheduledSessions.filter(session => 
          session.session_students.some(ss => teacherStudentIds.includes(ss.student_id))
        ).length;
      }

      // Calculate statistics
      const newStats: TeacherStats = {
        currentCapacity: capacityData?.length || 0,
        pendingTrials: trialStats?.filter(s => s.status === 'pending').length || 0,
        confirmedTrials: trialStats?.filter(s => s.status === 'confirmed').length || 0,
        completedTrials: trialStats?.filter(s => s.status === 'trial-completed').length || 0,
        rescheduledTrials: rescheduledCount,
        ghostedTrials: trialStats?.filter(s => s.status === 'trial-ghosted').length || 0
      };

      console.log('📊 Teacher statistics:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('❌ Error in fetchStatistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [user, dateRange]);

  return {
    stats,
    loading,
    refreshStats: fetchStatistics
  };
};
