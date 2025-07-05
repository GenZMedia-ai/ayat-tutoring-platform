import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RenewalCandidate {
  id: string;
  name: string;
  age: number;
  phone: string;
  country: string;
  completionRate: number;
  completedSessions: number;
  totalSessions: number;
  renewalReadiness: 'ready' | 'almost' | 'early';
  optimalMentionTime: string;
  salesAgentId: string;
  salesAgentName: string;
}

export const useRenewalCandidates = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<RenewalCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRenewalCandidates = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: activeStudents, error } = await supabase
        .from('students')
        .select(`
          id,
          name,
          age,
          phone,
          country,
          package_session_count,
          assigned_sales_agent_id,
          profiles!students_assigned_sales_agent_id_fkey(
            id,
            full_name
          )
        `)
        .eq('assigned_teacher_id', user.id)
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('❌ Error fetching renewal candidates:', error);
        return;
      }

      // Analyze each student's completion progress
      const candidatesWithProgress = await Promise.all(
        (activeStudents || []).map(async (student) => {
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

          // Only include students who are 50%+ complete (renewal candidates)
          if (completionRate < 50) return null;

          // Determine renewal readiness
          let renewalReadiness: 'ready' | 'almost' | 'early' = 'early';
          let optimalMentionTime = 'In 2-3 sessions';

          if (completionRate >= 80) {
            renewalReadiness = 'ready';
            optimalMentionTime = 'Mention now - ready for renewal discussion';
          } else if (completionRate >= 65) {
            renewalReadiness = 'almost';
            optimalMentionTime = 'In next 1-2 sessions';
          }

          return {
            id: student.id,
            name: student.name,
            age: student.age,
            phone: student.phone,
            country: student.country,
            completionRate,
            completedSessions,
            totalSessions,
            renewalReadiness,
            optimalMentionTime,
            salesAgentId: student.assigned_sales_agent_id,
            salesAgentName: (student.profiles as any)?.full_name || 'Unknown'
          };
        })
      );

      // Filter out null values and sort by completion rate (highest first)
      const validCandidates = candidatesWithProgress
        .filter(Boolean)
        .sort((a, b) => b!.completionRate - a!.completionRate) as RenewalCandidate[];

      setCandidates(validCandidates);
    } catch (error) {
      console.error('❌ Error in fetchRenewalCandidates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenewalCandidates();
  }, [user]);

  return {
    candidates,
    loading,
    refreshCandidates: fetchRenewalCandidates
  };
};