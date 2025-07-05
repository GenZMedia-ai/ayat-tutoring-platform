import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RecentlyCompletedStudent {
  id: string;
  name: string;
  age: number;
  phone: string;
  country: string;
  subscriptionCycle: number;
  lifetimeRevenue: number;
  completedDate: string;
  daysCompleted: number;
  completionRate: number;
  renewalPotential: 'high' | 'medium' | 'low';
  salesAgentId: string;
  salesAgentName: string;
}

export const useRecentlyCompletedStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<RecentlyCompletedStudent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecentlyCompleted = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get students that became expired in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: expiredStudents, error } = await supabase
        .from('students')
        .select(`
          id,
          name,
          age,
          phone,
          country,
          subscription_cycle,
          lifetime_revenue,
          updated_at,
          package_session_count,
          assigned_sales_agent_id,
          profiles!students_assigned_sales_agent_id_fkey(
            id,
            full_name
          )
        `)
        .eq('assigned_teacher_id', user.id)
        .eq('status', 'expired')
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching recently completed students:', error);
        return;
      }

      // Calculate completion rates and renewal potential
      const studentsWithAnalytics = await Promise.all(
        (expiredStudents || []).map(async (student) => {
          // Get session completion data
          const { data: sessionData } = await supabase
            .from('sessions')
            .select(`
              id,
              status,
              session_students!inner(student_id)
            `)
            .eq('session_students.student_id', student.id);

          const completedSessions = sessionData?.filter(s => s.status === 'completed').length || 0;
          const totalSessions = student.package_session_count || 8;
          const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

          // Calculate days since completion
          const daysCompleted = Math.floor(
            (new Date().getTime() - new Date(student.updated_at).getTime()) / (1000 * 60 * 60 * 24)
          );

          // Determine renewal potential
          let renewalPotential: 'high' | 'medium' | 'low' = 'low';
          if (completionRate >= 80 && daysCompleted <= 14) renewalPotential = 'high';
          else if (completionRate >= 60 && daysCompleted <= 21) renewalPotential = 'medium';

          return {
            id: student.id,
            name: student.name,
            age: student.age,
            phone: student.phone,
            country: student.country,
            subscriptionCycle: student.subscription_cycle || 1,
            lifetimeRevenue: student.lifetime_revenue || 0,
            completedDate: student.updated_at,
            daysCompleted,
            completionRate,
            renewalPotential,
            salesAgentId: student.assigned_sales_agent_id,
            salesAgentName: (student.profiles as any)?.full_name || 'Unknown'
          };
        })
      );

      setStudents(studentsWithAnalytics);
    } catch (error) {
      console.error('❌ Error in fetchRecentlyCompleted:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentlyCompleted();
  }, [user]);

  return {
    students,
    loading,
    refreshStudents: fetchRecentlyCompleted
  };
};