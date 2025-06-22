
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TodayPaidSession {
  session_id: string;
  student_id: string;
  student_name: string;
  student_unique_id: string;
  session_number: number;
  scheduled_time: string;
  platform: string;
  completed_sessions: number;
  package_session_count: number;
  phone: string;
  parent_name: string | null;
  notes: string | null;
}

export const useTodayPaidSessions = (teacherId?: string) => {
  return useQuery({
    queryKey: ['today-sessions', teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      
      console.log('🔍 Fetching today\'s paid sessions for teacher:', teacherId);
      
      // Get today's date in Egypt timezone
      const { data: currentDate } = await supabase.rpc('get_egypt_current_date');
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          session_number,
          scheduled_time,
          notes,
          session_students!inner (
            student_id,
            students!inner (
              id,
              name,
              unique_id,
              platform,
              phone,
              parent_name,
              notes,
              completed_sessions,
              package_session_count,
              assigned_teacher_id
            )
          )
        `)
        .eq('scheduled_date', currentDate)
        .eq('status', 'scheduled')
        .eq('session_students.students.assigned_teacher_id', teacherId)
        .eq('session_students.students.status', 'active');

      if (error) {
        console.error('Error fetching today sessions:', error);
        throw error;
      }

      console.log('📊 Raw session data:', data);

      const sessions = data?.map(session => ({
        session_id: session.id,
        student_id: session.session_students[0]?.students.id,
        student_name: session.session_students[0]?.students.name,
        student_unique_id: session.session_students[0]?.students.unique_id,
        session_number: session.session_number,
        scheduled_time: session.scheduled_time,
        platform: session.session_students[0]?.students.platform,
        completed_sessions: session.session_students[0]?.students.completed_sessions || 0,
        package_session_count: session.session_students[0]?.students.package_session_count || 0,
        phone: session.session_students[0]?.students.phone,
        parent_name: session.session_students[0]?.students.parent_name,
        notes: session.notes || session.session_students[0]?.students.notes
      })) || [];

      console.log('✅ Processed today sessions:', sessions);
      return sessions;
    },
    enabled: !!teacherId
  });
};
