
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InvitationCode {
  id: string;
  code: string;
  role: string;
  expires_at: string;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

interface CreateCodeData {
  code: string;
  role: 'teacher' | 'sales' | 'supervisor';
  expiresAt: string;
  usageLimit: number;
  teacherType?: string;
}

export const useInvitationCodes = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['invitation-codes'],
    queryFn: async (): Promise<InvitationCode[]> => {
      console.log('🔍 Fetching invitation codes...');
      
      const { data, error } = await supabase
        .from('invitation_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching invitation codes:', error);
        throw error;
      }

      console.log('✅ Invitation codes loaded:', data?.length || 0);
      return data || [];
    },
  });

  const createCodeMutation = useMutation({
    mutationFn: async (codeData: CreateCodeData) => {
      console.log('🔧 Creating invitation code:', codeData);
      
      const { data, error } = await supabase
        .from('invitation_codes')
        .insert({
          code: codeData.code,
          role: codeData.role,
          expires_at: codeData.expiresAt,
          usage_limit: codeData.usageLimit,
          created_by: (await supabase.auth.getUser()).data.user?.id || '',
          is_active: true,
          used_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating invitation code:', error);
        throw error;
      }

      console.log('✅ Invitation code created:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitation-codes'] });
      toast.success('Invitation code created successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to create invitation code:', error);
      toast.error('Failed to create invitation code');
    },
  });

  const deactivateCodeMutation = useMutation({
    mutationFn: async (codeId: string) => {
      console.log('🔧 Deactivating invitation code:', codeId);
      
      const { error } = await supabase
        .from('invitation_codes')
        .update({ is_active: false })
        .eq('id', codeId);

      if (error) {
        console.error('❌ Error deactivating invitation code:', error);
        throw error;
      }

      console.log('✅ Invitation code deactivated');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitation-codes'] });
      toast.success('Invitation code deactivated');
    },
    onError: (error) => {
      console.error('❌ Failed to deactivate invitation code:', error);
      toast.error('Failed to deactivate invitation code');
    },
  });

  const deleteCodeMutation = useMutation({
    mutationFn: async (codeId: string) => {
      console.log('🔧 Deleting invitation code:', codeId);
      
      const { error } = await supabase
        .from('invitation_codes')
        .delete()
        .eq('id', codeId);

      if (error) {
        console.error('❌ Error deleting invitation code:', error);
        throw error;
      }

      console.log('✅ Invitation code deleted');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitation-codes'] });
      toast.success('Invitation code deleted');
    },
    onError: (error) => {
      console.error('❌ Failed to delete invitation code:', error);
      toast.error('Failed to delete invitation code');
    },
  });

  return {
    data,
    isLoading,
    error,
    createCode: createCodeMutation.mutate,
    deactivateCode: deactivateCodeMutation.mutate,
    deleteCode: deleteCodeMutation.mutate,
  };
};
