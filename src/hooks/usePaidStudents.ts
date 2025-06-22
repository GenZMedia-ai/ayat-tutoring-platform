
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PaidStudent {
  id: string;
  unique_id: string;
  name: string;
  age: number;
  phone: string;
  country: string;
  platform: string;
  notes?: string;
  status: string;
  parent_name?: string;
  package_session_count: number;
  completed_sessions: number;
  package_purchased_at?: string;
  registration_completed_at?: string;
  family_group_id?: string;
  created_at: string;
  updated_at: string;
}

export const usePaidStudents = () => {
  const { user } = useAuth();
  const [paidStudents, setPaidStudents] = useState<PaidStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaidStudents = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Use direct query instead of RPC since the function may not be available yet
      const { data, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('assigned_teacher_id', user.id)
        .in('status', ['paid', 'active'])
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Transform data to match PaidStudent interface
      const transformedData: PaidStudent[] = (data || []).map(student => ({
        id: student.id,
        unique_id: student.unique_id,
        name: student.name,
        age: student.age,
        phone: student.phone,
        country: student.country,
        platform: student.platform,
        notes: student.notes,
        status: student.status,
        parent_name: student.parent_name,
        package_session_count: 0, // Default values until columns exist
        completed_sessions: 0, // Default values until columns exist
        package_purchased_at: undefined,
        registration_completed_at: undefined,
        family_group_id: student.family_group_id,
        created_at: student.created_at,
        updated_at: student.updated_at
      }));
      
      setPaidStudents(transformedData);
    } catch (err) {
      console.error('Error fetching paid students:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch paid students');
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async (studentId: string, sessionsData: any[]) => {
    try {
      // Since RPC functions may not be available, use direct database operations
      const { error: updateError } = await supabase
        .from('students')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (updateError) throw updateError;
      
      // Create sessions for the student
      for (const sessionData of sessionsData) {
        const { data: sessionResult, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            scheduled_date: sessionData.scheduled_date,
            scheduled_time: sessionData.scheduled_time,
            session_number: sessionData.session_number,
            status: 'scheduled',
            notes: `Registration session - ${sessionData.session_number}`
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        // Link student to session
        const { error: linkError } = await supabase
          .from('session_students')
          .insert({
            session_id: sessionResult.id,
            student_id: studentId
          });

        if (linkError) throw linkError;
      }
      
      // Refresh the paid students list
      await fetchPaidStudents();
      
      return { success: true };
    } catch (err) {
      console.error('Error completing registration:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchPaidStudents();
  }, [user?.id]);

  return {
    paidStudents,
    loading,
    error,
    fetchPaidStudents,
    completeRegistration
  };
};
