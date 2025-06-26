
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserStatistics } from '@/hooks/useUserStatistics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, UserCheck, Clock, Calendar } from 'lucide-react';

const ROLE_COLORS = {
  admin: '#ef4444',
  supervisor: '#3b82f6', 
  teacher: '#10b981',
  sales: '#f59e0b'
};

const STATUS_COLORS = {
  approved: '#10b981',
  pending: '#f59e0b',
  rejected: '#ef4444'
};

const RoleAnalytics: React.FC = () => {
  const { data: statistics, isLoading } = useUserStatistics();

  if (isLoading) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Role Analytics
          </CardTitle>
          <CardDescription>Loading analytics data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Role Analytics
          </CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Unable to load analytics data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const roleDistributionData = statistics.roleDistribution.map(role => ({
    name: role.role,
    total: role.total,
    approved: role.approved,
    pending: role.pending,
    color: ROLE_COLORS[role.role as keyof typeof ROLE_COLORS] || '#64748b'
  }));

  const statusDistributionData = statistics.roleDistribution.flatMap(role => [
    { name: `${role.role} - Approved`, value: role.approved, color: STATUS_COLORS.approved },
    { name: `${role.role} - Pending`, value: role.pending, color: STATUS_COLORS.pending }
  ]).filter(item => item.value > 0);

  const teacherTypesData = statistics.roleDistribution
    .find(role => role.role === 'teacher')?.teacherTypes || {};
  
  const teacherTypesChartData = Object.entries(teacherTypesData).map(([type, count]) => ({
    name: type,
    value: count,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{statistics.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Approved Users</p>
                <p className="text-2xl font-bold">
                  {statistics.roleDistribution.reduce((acc, role) => acc + role.approved, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold">{statistics.pendingApprovals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">New This Month</p>
                <p className="text-2xl font-bold">{statistics.newThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
            <CardDescription>Users by role and approval status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roleDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="approved" stackId="a" fill="#10b981" name="Approved" />
                <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Overall Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Status Overview</CardTitle>
            <CardDescription>Distribution of user approval status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Teacher Types Distribution */}
        {teacherTypesChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Teacher Types</CardTitle>
              <CardDescription>Distribution of teacher specializations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={teacherTypesChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {teacherTypesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Role Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Role Summary</CardTitle>
            <CardDescription>Detailed breakdown by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.roleDistribution.map((role) => (
                <div key={role.role} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: ROLE_COLORS[role.role as keyof typeof ROLE_COLORS] || '#64748b' }}
                    />
                    <div>
                      <p className="font-medium capitalize">{role.role}</p>
                      {role.teacherTypes && Object.keys(role.teacherTypes).length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Types: {Object.keys(role.teacherTypes).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{role.total} total</p>
                    <p className="text-xs text-muted-foreground">
                      {role.approved} approved, {role.pending} pending
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleAnalytics;
