
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DateRange } from '@/components/teacher/DateFilter';

interface RevenueStats {
  taughtHours: number;
  earnings: number;
  bonus: number;
  totalEarnings: number;
}

export const useTeacherRevenue = (dateRange: DateRange = 'this-month') => {
  const { user } = useAuth();
  const [revenue, setRevenue] = useState<RevenueStats>({
    taughtHours: 0,
    earnings: 0,
    bonus: 0,
    totalEarnings: 0
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

  const fetchRevenue = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { start, end } = getDateFilter(dateRange);
      
      console.log('🔍 Fetching teacher revenue:', { teacherId: user.id, dateRange, start, end });

      // Get completed sessions in the date range
      const { data: completedSessions, error } = await supabase
        .from('sessions')
        .select(`
          actual_minutes,
          scheduled_date,
          session_students!inner(
            student_id,
            students!inner(
              assigned_teacher_id
            )
          )
        `)
        .eq('status', 'completed')
        .eq('session_students.students.assigned_teacher_id', user.id)
        .gte('scheduled_date', start)
        .lte('scheduled_date', end);

      if (error) {
        console.error('❌ Error fetching revenue data:', error);
        return;
      }

      // Calculate total minutes and convert to hours
      const totalMinutes = completedSessions?.reduce((sum, session) => {
        return sum + (session.actual_minutes || 0);
      }, 0) || 0;

      const taughtHours = Math.round((totalMinutes / 60) * 100) / 100; // Round to 2 decimal places
      const earnings = taughtHours * 100; // 100 EGP per hour
      const bonus = 0; // TODO: Implement admin bonus system
      const totalEarnings = earnings + bonus;

      const revenueStats: RevenueStats = {
        taughtHours,
        earnings,
        bonus,
        totalEarnings
      };

      console.log('💰 Revenue statistics:', revenueStats);
      setRevenue(revenueStats);
    } catch (error) {
      console.error('❌ Error in fetchRevenue:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, [user, dateRange]);

  return {
    revenue,
    loading,
    refreshRevenue: fetchRevenue
  };
};
