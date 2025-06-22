
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TodayPaidSession {
  id: string;
  session_id: string;
  session_number: number;
  scheduled_date: string;
  scheduled_time: string;
  student_id: string;
  student_name: string;
  student_unique_id: string;
  completed_sessions: number;
  package_session_count: number;
  status: string;
  notes?: string;
  actual_minutes?: number;
  completed_at?: string;
}

export const useTodayPaidSessions = () => {
  const { user } = useAuth();
  const [todaySessions, setTodaySessions] = useState<TodayPaidSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodaySessions = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select(`
          id,
          session_number,
          scheduled_date,
          scheduled_time,
          status,
          notes,
          actual_minutes,
          completed_at,
          session_students!inner (
            student_id,
            students!inner (
              id,
              name,
              unique_id,
              assigned_teacher_id,
              status
            )
          )
        `)
        .eq('scheduled_date', today)
        .eq('session_students.students.assigned_teacher_id', user.id)
        .eq('session_students.students.status', 'active')
        .order('scheduled_time');

      if (fetchError) throw fetchError;
      
      // Transform the data structure
      const transformedSessions: TodayPaidSession[] = (data || []).map(session => ({
        id: session.id,
        session_id: session.id,
        session_number: session.session_number,
        scheduled_date: session.scheduled_date,
        scheduled_time: session.scheduled_time,
        student_id: session.session_students[0]?.students?.id || '',
        student_name: session.session_students[0]?.students?.name || '',
        student_unique_id: session.session_students[0]?.students?.unique_id || '',
        completed_sessions: 0, // Will be updated when database columns are available
        package_session_count: 0, // Will be updated when database columns are available
        status: session.status,
        notes: session.notes,
        actual_minutes: session.actual_minutes,
        completed_at: session.completed_at
      }));
      
      setTodaySessions(transformedSessions);
    } catch (err) {
      console.error('Error fetching today sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch today sessions');
    } finally {
      setLoading(false);
    }
  };

  const completeSession = async (sessionId: string, actualMinutes: number, notes: string) => {
    try {
      // Use direct database operations instead of RPC
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'completed',
          actual_minutes: actualMinutes,
          notes: notes,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      
      // Refresh the sessions list
      await fetchTodaySessions();
      
      return { success: true };
    } catch (err) {
      console.error('Error completing session:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTodaySessions();
  }, [user?.id]);

  return {
    todaySessions,
    loading,
    error,
    fetchTodaySessions,
    completeSession
  };
};
