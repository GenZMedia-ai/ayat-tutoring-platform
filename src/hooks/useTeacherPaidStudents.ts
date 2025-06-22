
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PaidStudent {
  id: string;
  uniqueId: string;
  name: string;
  age: number;
  phone: string;
  country: string;
  platform: string;
  parentName?: string;
  packageSessionCount: number;
  paymentAmount: number;
  paymentCurrency: string;
  paymentDate: string;
  notes?: string;
}

export const useTeacherPaidStudents = () => {
  const { user } = useAuth();
  const [paidStudents, setPaidStudents] = useState<PaidStudent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPaidStudents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔍 Fetching paid students for teacher:', user.id);
      
      const { data, error } = await supabase.rpc('get_teacher_paid_students', {
        p_teacher_id: user.id
      });

      if (error) {
        console.error('❌ Error fetching paid students:', error);
        toast.error('Failed to fetch paid students');
        return;
      }

      console.log('📋 Fetched paid students:', data);

      const mappedStudents: PaidStudent[] = data?.map(student => ({
        id: student.id,
        uniqueId: student.unique_id,
        name: student.name,
        age: student.age,
        phone: student.phone,
        country: student.country,
        platform: student.platform,
        parentName: student.parent_name,
        packageSessionCount: student.package_session_count,
        paymentAmount: student.payment_amount,
        paymentCurrency: student.payment_currency,
        paymentDate: student.payment_date,
        notes: student.notes,
      })) || [];

      setPaidStudents(mappedStudents);
    } catch (error) {
      console.error('❌ Error in fetchPaidStudents:', error);
      toast.error('Failed to load paid students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaidStudents();
  }, [user]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Setting up real-time updates for paid students');
    
    const channel = supabase
      .channel('teacher-paid-students')
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
          fetchPaidStudents();
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    paidStudents,
    loading,
    refreshPaidStudents: fetchPaidStudents,
  };
};
