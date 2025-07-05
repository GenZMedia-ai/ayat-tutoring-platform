import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RenewalOpportunity {
  id: string;
  name: string;
  age: number;
  phone: string;
  country: string;
  subscriptionCycle: number;
  lifetimeRevenue: number;
  renewalCount: number;
  lastPaymentDate: string;
  expiredDays: number;
  conversionProbability: number;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
}

export const useRenewalOpportunities = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<RenewalOpportunity[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOpportunities = async () => {
    if (!user) return;

    setLoading(true);
    try {
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
          renewal_count,
          first_payment_date,
          package_session_count,
          updated_at
        `)
        .eq('assigned_sales_agent_id', user.id)
        .eq('status', 'expired')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching renewal opportunities:', error);
        return;
      }

      // Calculate renewal opportunities with AI scoring
      const opportunitiesWithScoring = await Promise.all(
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

          // Calculate days since expiry
          const expiredDays = Math.floor(
            (new Date().getTime() - new Date(student.updated_at).getTime()) / (1000 * 60 * 60 * 24)
          );

          // AI-based conversion probability scoring
          let conversionProbability = 50; // Base score
          
          // Factors that increase probability
          if (completionRate >= 80) conversionProbability += 30;
          else if (completionRate >= 50) conversionProbability += 15;
          
          if (student.renewal_count > 0) conversionProbability += 25;
          if (student.lifetime_revenue > 200) conversionProbability += 15;
          
          // Time decay (recent expiry = higher chance)
          if (expiredDays <= 7) conversionProbability += 20;
          else if (expiredDays <= 30) conversionProbability += 10;
          else if (expiredDays > 60) conversionProbability -= 20;

          // Cap at 95%
          conversionProbability = Math.min(95, Math.max(5, conversionProbability));

          return {
            id: student.id,
            name: student.name,
            age: student.age,
            phone: student.phone,
            country: student.country,
            subscriptionCycle: student.subscription_cycle || 1,
            lifetimeRevenue: student.lifetime_revenue || 0,
            renewalCount: student.renewal_count || 0,
            lastPaymentDate: student.first_payment_date,
            expiredDays,
            conversionProbability,
            totalSessions,
            completedSessions,
            completionRate
          };
        })
      );

      // Sort by conversion probability (highest first)
      const sortedOpportunities = opportunitiesWithScoring.sort(
        (a, b) => b.conversionProbability - a.conversionProbability
      );

      setOpportunities(sortedOpportunities);
    } catch (error) {
      console.error('❌ Error in fetchOpportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [user]);

  return {
    opportunities,
    loading,
    refreshOpportunities: fetchOpportunities
  };
};