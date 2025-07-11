
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDateTimeInEgypt } from '@/utils/egyptTimezone';

export interface EnhancedSessionData {
  id: string;
  studentId: string;
  studentName: string;
  parentName?: string;
  familyId?: string;
  sessionNumber: number;
  totalSessions: number;
  scheduledDate: string;
  scheduledTime: string;
  formattedDateTime: string;
  phone: string;
  platform: string;
  packageName: string;
  country: string;
  isFamily: boolean;
  status: string;
}

export const useEnhancedSessionData = () => {
  const [sessions, setSessions] = useState<EnhancedSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get today's paid sessions for the teacher
      const today = new Date().toISOString().split('T')[0];
      
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          session_number,
          scheduled_date,
          scheduled_time,
          status,
          session_students!inner(
            student_id,
            students!inner(
              id,
              name,
              parent_name,
              phone,
              platform,
              country,
              package_name,
              package_session_count,
              family_group_id,
              status,
              family_groups(
                id,
                unique_id,
                parent_name
              )
            )
          )
        `)
        .eq('session_students.students.assigned_teacher_id', user.id)
        .eq('session_students.students.status', 'paid')
        .eq('scheduled_date', today)
        .eq('status', 'scheduled')
        .gte('session_number', 1) // Include trial sessions (session_number = 1) for display
        .order('scheduled_time');

      if (sessionsError) throw sessionsError;

      const enhancedSessions: EnhancedSessionData[] = (sessionsData || []).map((session) => {
        const student = session.session_students[0]?.students;
        if (!student) return null;

        const isFamily = !!student.family_group_id;
        const parentName = isFamily 
          ? student.family_groups?.parent_name || student.parent_name
          : student.parent_name;
        
        const familyId = isFamily 
          ? student.family_groups?.unique_id
          : undefined;

        // Calculate progress excluding trial session (session_number = 1)
        const totalSessions = student.package_session_count || 8;
        const currentSessionNumber = session.session_number > 1 ? session.session_number - 1 : 1;

        return {
          id: session.id,
          studentId: student.id,
          studentName: student.name,
          parentName,
          familyId,
          sessionNumber: currentSessionNumber,
          totalSessions,
          scheduledDate: session.scheduled_date,
          scheduledTime: session.scheduled_time,
          formattedDateTime: formatDateTimeInEgypt(
            session.scheduled_date, 
            session.scheduled_time, 
            "EEEE, MMM d 'at' h:mm a"
          ),
          phone: student.phone,
          platform: student.platform,
          packageName: student.package_name || 'Standard Package',
          country: student.country,
          isFamily,
          status: session.status
        };
      }).filter(Boolean) as EnhancedSessionData[];

      setSessions(enhancedSessions);
    } catch (err) {
      console.error('Error fetching enhanced session data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions,
    loading,
    error,
    refreshSessions: fetchSessions
  };
};
