
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TrialStudent {
  id: string;
  name: string;
  age: number;
  phone: string;
  country: string;
  trialDate: string;
  trialTime: string;
  status: string;
  uniqueId: string;
  parentName?: string;
  notes?: string;
  assignedTeacher?: string;
  assignedSalesAgent?: string;
  assignedSupervisor?: string;
}

export const useTeacherTrialSessions = () => {
  const { user } = useAuth();
  const [trialStudents, setTrialStudents] = useState<TrialStudent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrialSessions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔍 Fetching trial sessions for teacher:', user.id);
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('assigned_teacher_id', user.id)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching trial sessions:', error);
        toast.error('Failed to fetch trial sessions');
        return;
      }

      console.log('📋 Fetched trial sessions:', data);

      const mappedStudents: TrialStudent[] = data?.map(student => ({
        id: student.id,
        name: student.name,
        age: student.age,
        phone: student.phone,
        country: student.country,
        trialDate: student.trial_date || '',
        trialTime: student.trial_time || '',
        status: student.status,
        uniqueId: student.unique_id,
        parentName: student.parent_name,
        notes: student.notes,
        assignedTeacher: student.assigned_teacher_id,
        assignedSalesAgent: student.assigned_sales_agent_id,
        assignedSupervisor: student.assigned_supervisor_id,
      })) || [];

      setTrialStudents(mappedStudents);
    } catch (error) {
      console.error('❌ Error in fetchTrialSessions:', error);
      toast.error('Failed to load trial sessions');
    } finally {
      setLoading(false);
    }
  };

  const confirmTrial = async (studentId: string) => {
    try {
      console.log('✅ Confirming trial for student:', studentId);
      
      const { error } = await supabase
        .from('students')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) {
        console.error('❌ Error confirming trial:', error);
        toast.error('Failed to confirm trial');
        return false;
      }

      toast.success('Trial confirmed successfully!');
      await fetchTrialSessions(); // Refresh data
      return true;
    } catch (error) {
      console.error('❌ Error in confirmTrial:', error);
      toast.error('Failed to confirm trial');
      return false;
    }
  };

  useEffect(() => {
    fetchTrialSessions();
  }, [user]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Setting up real-time updates for teacher trial sessions');
    
    const channel = supabase
      .channel('teacher-trial-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `assigned_teacher_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Real-time update received:', payload);
          fetchTrialSessions();
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    trialStudents,
    loading,
    confirmTrial,
    refreshTrialSessions: fetchTrialSessions,
  };
};
