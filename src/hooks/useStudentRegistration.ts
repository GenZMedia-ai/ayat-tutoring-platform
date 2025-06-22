
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionSchedule {
  date: string;
  time: string;
  sessionNumber: number;
}

export const useStudentRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, sessionSchedules }: { 
      studentId: string; 
      sessionSchedules: SessionSchedule[] 
    }) => {
      const { data, error } = await supabase.rpc('complete_student_registration', {
        p_student_id: studentId,
        p_session_schedules: sessionSchedules
      });

      if (error) {
        console.error('Registration error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success('Student registration completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['paid-students'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['today-sessions'] });
    },
    onError: (error: any) => {
      console.error('Registration failed:', error);
      toast.error(error.message || 'Failed to complete registration');
    }
  });
};
