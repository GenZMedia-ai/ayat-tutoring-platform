
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
      
      const { data, error: fetchError } = await supabase
        .rpc('get_teacher_paid_students', {
          teacher_id_param: user.id
        });

      if (fetchError) throw fetchError;
      
      setPaidStudents(data || []);
    } catch (err) {
      console.error('Error fetching paid students:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch paid students');
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async (studentId: string, sessionsData: any[]) => {
    try {
      const { data, error } = await supabase
        .rpc('complete_student_registration', {
          student_id_param: studentId,
          sessions_data: sessionsData
        });

      if (error) throw error;
      
      // Refresh the paid students list
      await fetchPaidStudents();
      
      return { success: true, data };
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
