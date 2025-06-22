
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompleteSessionData {
  sessionId: string;
  actualMinutes: number;
  learningNotes: string;
  attendanceConfirmed: boolean;
}

export const useSessionCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, actualMinutes, learningNotes, attendanceConfirmed }: CompleteSessionData) => {
      const { data, error } = await supabase.rpc('complete_session_with_details', {
        p_session_id: sessionId,
        p_actual_minutes: actualMinutes,
        p_learning_notes: learningNotes,
        p_attendance_confirmed: attendanceConfirmed
      });

      if (error) {
        console.error('Session completion error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.package_complete) {
        toast.success('Session completed! Student package is now complete.');
      } else {
        toast.success(`Session completed! Progress: ${data.completed_sessions}/${data.package_sessions} sessions`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['teacher-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['today-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['student-progress'] });
    },
    onError: (error: any) => {
      console.error('Session completion failed:', error);
      toast.error(error.message || 'Failed to complete session');
    }
  });
};
