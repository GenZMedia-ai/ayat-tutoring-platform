
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const usePendingApprovals = () => {
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

  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('🔧 Approving user:', userId);
      
      const currentUser = await supabase.auth.getUser();
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'approved',
          approved_by: currentUser.data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error approving user:', error);
        throw error;
      }

      console.log('✅ User approved');
    },
    onSuccess: () => {
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
      console.log('🔧 Rejecting user:', userId, 'Reason:', reason);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'rejected'
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error rejecting user:', error);
        throw error;
      }

      console.log('✅ User rejected');
    },
    onSuccess: () => {
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
