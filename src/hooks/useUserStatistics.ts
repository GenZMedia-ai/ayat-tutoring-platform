
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RoleDistribution {
  role: string;
  total: number;
  approved: number;
  pending: number;
  teacherTypes?: Record<string, number>;
}

interface UserStatistics {
  roleDistribution: RoleDistribution[];
  totalUsers: number;
  pendingApprovals: number;
  newThisMonth: number;
}

export const useUserStatistics = () => {
  return useQuery({
    queryKey: ['user-statistics'],
    queryFn: async (): Promise<UserStatistics> => {
      console.log('🔍 Fetching user statistics...');

      // Get role distribution with counts
      const { data: roleStats, error: roleError } = await supabase
        .from('profiles')
        .select('role, status, teacher_type, created_at');

      if (roleError) {
        console.error('❌ Error fetching role statistics:', roleError);
        throw roleError;
      }

      // Process role distribution
      const roleMap = new Map<string, { total: number; approved: number; pending: number; teacherTypes: Record<string, number> }>();
      
      roleStats?.forEach(user => {
        const role = user.role;
        if (!roleMap.has(role)) {
          roleMap.set(role, { total: 0, approved: 0, pending: 0, teacherTypes: {} });
        }
        
        const roleData = roleMap.get(role)!;
        roleData.total++;
        
        if (user.status === 'approved') {
          roleData.approved++;
        } else if (user.status === 'pending') {
          roleData.pending++;
        }
        
        // Track teacher types
        if (role === 'teacher' && user.teacher_type) {
          roleData.teacherTypes[user.teacher_type] = (roleData.teacherTypes[user.teacher_type] || 0) + 1;
        }
      });

      const roleDistribution: RoleDistribution[] = Array.from(roleMap.entries()).map(([role, data]) => ({
        role,
        total: data.total,
        approved: data.approved,
        pending: data.pending,
        ...(role === 'teacher' && { teacherTypes: data.teacherTypes })
      }));

      // Calculate totals
      const totalUsers = roleStats?.length || 0;
      const pendingApprovals = roleStats?.filter(user => user.status === 'pending').length || 0;
      
      // Calculate new users this month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const newThisMonth = roleStats?.filter(user => {
        const userDate = new Date(user.created_at);
        return userDate.getMonth() + 1 === currentMonth && userDate.getFullYear() === currentYear;
      }).length || 0;

      console.log('✅ User statistics loaded:', {
        roleDistribution,
        totalUsers,
        pendingApprovals,
        newThisMonth
      });

      return {
        roleDistribution,
        totalUsers,
        pendingApprovals,
        newThisMonth
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
