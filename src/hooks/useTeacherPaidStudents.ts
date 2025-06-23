
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
  packageName: string;
  paymentAmount: number;
  paymentCurrency: string;
  paymentDate: string;
  notes?: string;
  hasCompletedRegistration?: boolean;
  isFamilyMember?: boolean;
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
      
      // Use the enhanced edge function for better family payment handling
      const { data, error } = await supabase.functions.invoke('get-teacher-paid-students-enhanced', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('❌ Error fetching paid students:', error);
        
        // Fallback to the original RPC function
        console.log('🔄 Falling back to original RPC function');
        const { data: fallbackData, error: fallbackError } = await supabase.rpc('get_teacher_paid_students', {
          p_teacher_id: user.id
        });

        if (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          toast.error('Failed to fetch paid students');
          return;
        }

        const mappedStudents: PaidStudent[] = fallbackData?.map(student => ({
          id: student.id,
          uniqueId: student.unique_id,
          name: student.name,
          age: student.age,
          phone: student.phone,
          country: student.country,
          platform: student.platform,
          parentName: student.parent_name,
          packageSessionCount: student.package_session_count || 8,
          packageName: 'Standard Package',
          paymentAmount: student.payment_amount || 0,
          paymentCurrency: student.payment_currency || 'USD',
          paymentDate: student.payment_date || new Date().toISOString(),
          notes: student.notes,
          hasCompletedRegistration: false,
          isFamilyMember: false
        })) || [];

        setPaidStudents(mappedStudents);
        return;
      }

      console.log('📋 Fetched paid students via enhanced function:', data);
      setPaidStudents(data || []);
      
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_links'
        },
        (payload) => {
          console.log('🔄 Payment link update received:', payload);
          fetchPaidStudents();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_package_selections'
        },
        (payload) => {
          console.log('🔄 Family package selection update received:', payload);
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
