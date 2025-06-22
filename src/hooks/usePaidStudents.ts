
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PaidStudent {
  id: string;
  unique_id: string;
  name: string;
  age: number;
  phone: string;
  country: string;
  platform: string;
  package_session_count: number;
  package_purchased_at: string;
  parent_name: string | null;
  notes: string | null;
}

export const usePaidStudents = (teacherId?: string) => {
  return useQuery({
    queryKey: ['paid-students', teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      
      const { data, error } = await supabase.rpc('get_teacher_paid_students', {
        p_teacher_id: teacherId
      });

      if (error) {
        console.error('Error fetching paid students:', error);
        throw error;
      }

      return data as PaidStudent[];
    },
    enabled: !!teacherId
  });
};
