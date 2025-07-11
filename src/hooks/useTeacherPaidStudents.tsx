
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
  isScheduled?: boolean;
}

export interface FamilyCardData {
  id: string;
  type: 'family';
  familyName: string;
  parentName: string;
  parentPhone: string;
  paymentDate: string;
  students: PaidStudent[];
  totalStudents: number;
  scheduledStudents: number;
  totalSessions: number;
  completedSessions: number;
}

export type PaidStudentItem = PaidStudent | FamilyCardData;

export const useTeacherPaidStudents = () => {
  const { user } = useAuth();
  const [paidStudents, setPaidStudents] = useState<PaidStudentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPaidStudents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔍 Fetching paid students for teacher:', user.id);
      
      const { data, error } = await supabase.functions.invoke('get-teacher-paid-students-enhanced', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('❌ Error fetching paid students:', error);
        toast.error('Failed to fetch paid students');
        return;
      }

      console.log('📋 Fetched paid students:', data);
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
