
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DateRange } from '@/components/teacher/DateFilter';

interface TeacherStatistics {
  currentCapacity: number;
  pendingTrials: number;
  confirmedTrials: number;
  completedTrials: number;
  rescheduledTrials: number;
  ghostedTrials: number;
  // Phase 1: New paid student statistics
  paidStudents: number;
  totalStudents: number;
  expiredStudents: number;
  completedRegistrations: number;
}

const getDateRangeFilter = (dateRange: DateRange): { startDate: string; endDate: string } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (dateRange) {
    case 'today':
      return {
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: yesterday.toISOString().split('T')[0],
        endDate: yesterday.toISOString().split('T')[0]
      };
    case 'last-7-days':
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return {
        startDate: lastWeek.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };
    case 'this-month':
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: firstDayThisMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };
    case 'last-month':
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: firstDayLastMonth.toISOString().split('T')[0],
        endDate: lastDayLastMonth.toISOString().split('T')[0]
      };
    case 'all-time':
    default:
      return {
        startDate: '2020-01-01',
        endDate: '2030-12-31'
      };
  }
};

export const useTeacherStatistics = (dateRange: DateRange = 'today') => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TeacherStatistics>({
    currentCapacity: 0,
    pendingTrials: 0,
    confirmedTrials: 0,
    completedTrials: 0,
    rescheduledTrials: 0,
    ghostedTrials: 0,
    paidStudents: 0,
    totalStudents: 0,
    expiredStudents: 0,
    completedRegistrations: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchStatistics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('📊 PHASE 1: Fetching teacher statistics with enhanced filter logic:', { teacherId: user.id, dateRange });

      const { startDate, endDate } = getDateRangeFilter(dateRange);
      console.log('📅 PHASE 1: Date range filter:', { startDate, endDate });

      // Current capacity (all active students)
      const { data: activeStudents, error: activeError } = await supabase
        .from('students')
        .select('id')
        .eq('assigned_teacher_id', user.id)
        .eq('status', 'active');

      if (activeError) {
        console.error('❌ PHASE 1: Error fetching active students:', activeError);
        throw activeError;
      }

      console.log('✅ PHASE 1: Active students found:', activeStudents?.length || 0);

      // PHASE 1 FIX: Use trial_date for filtering (session date, not creation date)
      const { data: individualStudents, error: individualsError } = await supabase
        .from('students')
        .select('id, status, trial_date')
        .eq('assigned_teacher_id', user.id)
        .is('family_group_id', null)
        .gte('trial_date', startDate)
        .lte('trial_date', endDate);

      if (individualsError) {
        console.error('❌ PHASE 1: Error fetching individual students:', individualsError);
        throw individualsError;
      }

      console.log('✅ PHASE 1: Individual students in date range:', individualStudents?.length || 0);

      // PHASE 1 FIX: Use trial_date for family groups filtering
      const { data: familyGroups, error: familyError } = await supabase
        .from('family_groups')
        .select('id, status, trial_date, student_count')
        .eq('assigned_teacher_id', user.id)
        .gte('trial_date', startDate)
        .lte('trial_date', endDate);

      if (familyError) {
        console.error('❌ PHASE 1: Error fetching family groups:', familyError);
        throw familyError;
      }

      console.log('✅ PHASE 1: Family groups in date range:', familyGroups?.length || 0);

      // Phase 1: Fetch paid student statistics with efficient parallel queries
      const [paidData, totalData, expiredData, completedData] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true })
          .eq('assigned_teacher_id', user.id).in('status', ['active', 'paid']),
        supabase.from('students').select('id', { count: 'exact', head: true })
          .eq('assigned_teacher_id', user.id),
        supabase.from('students').select('id', { count: 'exact', head: true })
          .eq('assigned_teacher_id', user.id).eq('status', 'expired'),
        supabase.from('students').select('id', { count: 'exact', head: true })
          .eq('assigned_teacher_id', user.id).eq('status', 'active')
      ]);

      console.log('✅ PHASE 1: Paid student statistics:', {
        paid: paidData.count || 0,
        total: totalData.count || 0,
        expired: expiredData.count || 0,
        completed: completedData.count || 0
      });

      // Calculate statistics
      const individualsByStatus = {
        pending: individualStudents?.filter(s => s.status === 'pending').length || 0,
        confirmed: individualStudents?.filter(s => s.status === 'confirmed').length || 0,
        completed: individualStudents?.filter(s => s.status === 'trial-completed').length || 0,
        ghosted: individualStudents?.filter(s => s.status === 'trial-ghosted').length || 0,
        rescheduled: individualStudents?.filter(s => s.status === 'rescheduled').length || 0,
      };

      // Family groups count as single units for statistics
      const familiesByStatus = {
        pending: familyGroups?.filter(f => f.status === 'pending').length || 0,
        confirmed: familyGroups?.filter(f => f.status === 'confirmed').length || 0,
        completed: familyGroups?.filter(f => f.status === 'trial-completed').length || 0,
        ghosted: familyGroups?.filter(f => f.status === 'trial-ghosted').length || 0,
        rescheduled: familyGroups?.filter(f => f.status === 'rescheduled').length || 0,
      };

      const newStats = {
        currentCapacity: activeStudents?.length || 0,
        pendingTrials: individualsByStatus.pending + familiesByStatus.pending,
        confirmedTrials: individualsByStatus.confirmed + familiesByStatus.confirmed,
        completedTrials: individualsByStatus.completed + familiesByStatus.completed,
        rescheduledTrials: individualsByStatus.rescheduled + familiesByStatus.rescheduled,
        ghostedTrials: individualsByStatus.ghosted + familiesByStatus.ghosted,
        // Phase 1: Add new paid student statistics
        paidStudents: paidData.count || 0,
        totalStudents: totalData.count || 0,
        expiredStudents: expiredData.count || 0,
        completedRegistrations: completedData.count || 0,
      };

      console.log('📊 PHASE 1: Calculated statistics with enhanced filtering:', {
        dateRange,
        filterUsed: 'trial_date',
        dateRangeApplied: { startDate, endDate },
        individualsByStatus,
        familiesByStatus,
        finalStats: newStats
      });

      setStats(newStats);
    } catch (error) {
      console.error('❌ PHASE 1: Error fetching teacher statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [user, dateRange]);

  return { stats, loading, refreshStats: fetchStatistics };
};
