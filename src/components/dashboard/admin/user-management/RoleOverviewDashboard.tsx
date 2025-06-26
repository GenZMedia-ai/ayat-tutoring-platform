
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Clock, TrendingUp } from 'lucide-react';
import { useUserStatistics } from '@/hooks/useUserStatistics';
import { Skeleton } from '@/components/ui/skeleton';

const RoleOverviewDashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useUserStatistics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading user statistics: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'sales': return '💼';
      case 'teacher': return '👨‍🏫';
      case 'supervisor': return '👥';
      default: return '👤';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'sales': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'supervisor': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats?.roleDistribution?.map((role) => (
          <Card key={role.role}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {role.role}s
              </CardTitle>
              <div className="text-2xl">{getRoleIcon(role.role)}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{role.total}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className={getRoleColor(role.role)}>
                  {role.approved} approved
                </Badge>
                {role.pending > 0 && (
                  <Badge variant="outline" className="text-yellow-600">
                    {role.pending} pending
                  </Badge>
                )}
              </div>
              {role.role === 'teacher' && role.teacherTypes && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {Object.entries(role.teacherTypes).map(([type, count]) => (
                    <div key={type}>
                      {type}: {count}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active system users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.pendingApprovals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.newThisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Recent registrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Create Invitation Code
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Review Pending Users
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Export User List
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Send Announcement
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleOverviewDashboard;
