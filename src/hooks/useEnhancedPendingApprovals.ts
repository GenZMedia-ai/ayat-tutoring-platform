
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  teacher_type?: string;
  language: string;
  created_at: string;
  status: string;
}

export const useEnhancedPendingApprovals = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async (): Promise<PendingUser[]> => {
      console.log('🔍 Fetching pending user approvals...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching pending approvals:', error);
        throw error;
      }

      console.log('✅ Pending approvals loaded:', data?.length || 0);
      return data || [];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Set up real-time subscription
  useEffect(() => {
    console.log('🔄 Setting up real-time subscription for profiles');
    
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('📡 Real-time update received:', payload);
          
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
          queryClient.invalidateQueries({ queryKey: ['user-statistics'] });
          
          // Show toast for status changes
          if (payload.eventType === 'UPDATE') {
            const oldStatus = payload.old?.status;
            const newStatus = payload.new?.status;
            const userName = payload.new?.full_name;
            
            if (oldStatus !== newStatus) {
              if (newStatus === 'approved') {
                toast.success(`${userName} has been approved`);
              } else if (newStatus === 'rejected') {
                toast.error(`${userName} has been rejected`);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('🔧 Approving user with audit:', userId);
      
      const { data, error } = await supabase.rpc('approve_user_with_audit', {
        p_user_id: userId
      });

      if (error) {
        console.error('❌ Error approving user:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to approve user');
      }

      console.log('✅ User approved with audit:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['user-statistics'] });
      toast.success('User approved successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to approve user:', error);
      toast.error('Failed to approve user');
    },
  });

  const rejectUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      console.log('🔧 Rejecting user with audit:', userId, 'Reason:', reason);
      
      const { data, error } = await supabase.rpc('reject_user_with_audit', {
        p_user_id: userId,
        p_reason: reason
      });

      if (error) {
        console.error('❌ Error rejecting user:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to reject user');
      }

      console.log('✅ User rejected with audit:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['user-statistics'] });
      toast.success('User rejected');
    },
    onError: (error) => {
      console.error('❌ Failed to reject user:', error);
      toast.error('Failed to reject user');
    },
  });

  return {
    data,
    isLoading,
    approveUser: (userId: string) => approveUserMutation.mutate(userId),
    rejectUser: (userId: string, reason: string) => rejectUserMutation.mutate({ userId, reason })
  };
};
