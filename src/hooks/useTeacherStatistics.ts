
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
  paidStudents: number;
  totalStudents: number;
  expiredStudents: number;
  completedRegistrations: number;
}

const getDateRangeFilter = (dateRange: DateRange): { startDate: string; endDate: string } => {
  const now = new Date();
  
  // FIXED: Use Egypt timezone consistently and handle date boundaries properly
  const egyptNow = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Cairo"}));
  const today = new Date(egyptNow.getFullYear(), egyptNow.getMonth(), egyptNow.getDate());
  
  console.log('🕒 FIXED: Date calculation using Egypt timezone:', {
    originalNow: now.toISOString(),
    egyptNow: egyptNow.toISOString(),
    calculatedToday: today.toDateString()
  });
  
  switch (dateRange) {
    case 'today':
      const todayStr = today.toISOString().split('T')[0];
      return {
        startDate: todayStr,
        endDate: todayStr
      };
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      return {
        startDate: yesterdayStr,
        endDate: yesterdayStr
      };
    case 'last-7-days':
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return {
        startDate: lastWeek.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };
    case 'this-month':
      const firstDayThisMonth = new Date(egyptNow.getFullYear(), egyptNow.getMonth(), 1);
      return {
        startDate: firstDayThisMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };
    case 'last-month':
      const firstDayLastMonth = new Date(egyptNow.getFullYear(), egyptNow.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(egyptNow.getFullYear(), egyptNow.getMonth(), 0);
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
      console.log('📊 FIXED: Starting teacher statistics fetch with improved filtering:', { teacherId: user.id, dateRange });

      const { startDate, endDate } = getDateRangeFilter(dateRange);
      console.log('📅 FIXED: Using date range:', { startDate, endDate, dateRange });

      // FIXED: Get current capacity with broader status filter
      const { data: activeStudents, error: activeError } = await supabase
        .from('students')
        .select('id')
        .eq('assigned_teacher_id', user.id)
        .in('status', ['active', 'paid']); // FIXED: Include both active and paid students

      if (activeError) {
        console.error('❌ Error fetching active students:', activeError);
        throw activeError;
      }

      console.log('✅ FIXED: Active students found:', activeStudents?.length || 0);

      // FIXED: Use created_at for broader data coverage when trial_date filtering is too restrictive
      let individualStudents = [];
      let familyGroups = [];

      // Try trial_date filtering first
      const { data: trialDateStudents } = await supabase
        .from('students')
        .select('id, status, trial_date, created_at')
        .eq('assigned_teacher_id', user.id)
        .is('family_group_id', null)
        .gte('trial_date', startDate)
        .lte('trial_date', endDate);

      // FIXED: Fallback to created_at if trial_date returns no results
      if (!trialDateStudents || trialDateStudents.length === 0) {
        console.log('📝 FIXED: No trial_date results, trying created_at filter');
        const { data: createdAtStudents } = await supabase
          .from('students')
          .select('id, status, trial_date, created_at')
          .eq('assigned_teacher_id', user.id)
          .is('family_group_id', null)
          .gte('created_at', startDate + 'T00:00:00')
          .lte('created_at', endDate + 'T23:59:59');
        
        individualStudents = createdAtStudents || [];
      } else {
        individualStudents = trialDateStudents;
      }

      console.log('✅ FIXED: Individual students in date range:', individualStudents?.length || 0);

      // FIXED: Same fallback logic for family groups
      const { data: trialDateFamilies } = await supabase
        .from('family_groups')
        .select('id, status, trial_date, student_count, created_at')
        .eq('assigned_teacher_id', user.id)
        .gte('trial_date', startDate)
        .lte('trial_date', endDate);

      if (!trialDateFamilies || trialDateFamilies.length === 0) {
        console.log('📝 FIXED: No family trial_date results, trying created_at filter');
        const { data: createdAtFamilies } = await supabase
          .from('family_groups')
          .select('id, status, trial_date, student_count, created_at')
          .eq('assigned_teacher_id', user.id)
          .gte('created_at', startDate + 'T00:00:00')
          .lte('created_at', endDate + 'T23:59:59');
        
        familyGroups = createdAtFamilies || [];
      } else {
        familyGroups = trialDateFamilies;
      }

      console.log('✅ FIXED: Family groups in date range:', familyGroups?.length || 0);

      // FIXED: Enhanced paid student statistics with broader status coverage
      const [paidData, totalData, expiredData, completedData] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true })
          .eq('assigned_teacher_id', user.id).in('status', ['active', 'paid']), // FIXED: Include paid status
        supabase.from('students').select('id', { count: 'exact', head: true })
          .eq('assigned_teacher_id', user.id),
        supabase.from('students').select('id', { count: 'exact', head: true })
          .eq('assigned_teacher_id', user.id).eq('status', 'expired'),
        supabase.from('students').select('id', { count: 'exact', head: true })
          .eq('assigned_teacher_id', user.id).eq('status', 'active')
      ]);

      console.log('✅ FIXED: Enhanced paid student statistics:', {
        paid: paidData.count || 0,
        total: totalData.count || 0,
        expired: expiredData.count || 0,
        completed: completedData.count || 0
      });

      // FIXED: Enhanced status categorization with better handling
      const individualsByStatus = {
        pending: individualStudents?.filter(s => ['pending', 'awaiting-payment'].includes(s.status)).length || 0,
        confirmed: individualStudents?.filter(s => s.status === 'confirmed').length || 0,
        completed: individualStudents?.filter(s => ['trial-completed', 'follow-up'].includes(s.status)).length || 0,
        ghosted: individualStudents?.filter(s => s.status === 'trial-ghosted').length || 0,
        rescheduled: individualStudents?.filter(s => s.status === 'rescheduled').length || 0,
      };

      const familiesByStatus = {
        pending: familyGroups?.filter(f => ['pending', 'awaiting-payment'].includes(f.status)).length || 0,
        confirmed: familyGroups?.filter(f => f.status === 'confirmed').length || 0,
        completed: familyGroups?.filter(f => ['trial-completed', 'follow-up'].includes(f.status)).length || 0,
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
        paidStudents: paidData.count || 0,
        totalStudents: totalData.count || 0,
        expiredStudents: expiredData.count || 0,
        completedRegistrations: completedData.count || 0,
      };

      console.log('📊 FIXED: Final statistics with enhanced filtering and fallbacks:', {
        dateRange,
        dateRangeApplied: { startDate, endDate },
        individualsByStatus,
        familiesByStatus,
        finalStats: newStats,
        hasAnyData: newStats.totalStudents > 0
      });

      setStats(newStats);
    } catch (error) {
      console.error('❌ FIXED: Error fetching teacher statistics:', error);
      // FIXED: Set empty stats instead of leaving undefined
      setStats({
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [user, dateRange]);

  return { stats, loading, refreshStats: fetchStatistics };
};
