
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdvancedFinancialData } from '@/hooks/useAdvancedFinancialData';
import { usePackageManagement } from '@/hooks/usePackageManagement';
import { useCurrencyManagement } from '@/hooks/useCurrencyManagement';
import BusinessIntelligenceDashboard from './analytics/BusinessIntelligenceDashboard';
import { 
  TrendingUp, 
  Settings, 
  Users, 
  CreditCard, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap
} from 'lucide-react';

const AdminHomepage: React.FC = () => {
  const { metrics, systemMetrics, loading, error, refetch } = useAdvancedFinancialData();
  const { packages } = usePackageManagement();
  const { currencies } = useCurrencyManagement();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getHealthStatus = () => {
    const issues = [];
    if (metrics.monthlyGrowth < 15) issues.push('Monthly growth below target');
    if (metrics.teacherUtilization < 80) issues.push('Teacher utilization low');
    if (metrics.conversionRate < 65) issues.push('Conversion rate needs improvement');
    if (systemMetrics.pendingApprovals > 0) issues.push(`${systemMetrics.pendingApprovals} pending approvals`);
    
    return {
      status: issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'warning' : 'critical',
      issues
    };
  };

  const healthStatus = getHealthStatus();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header with System Status */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Administrative Command Center</h1>
          <p className="text-muted-foreground">
            Comprehensive system oversight with real-time analytics and configuration management
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge 
            variant={healthStatus.status === 'healthy' ? 'default' : 
                   healthStatus.status === 'warning' ? 'secondary' : 'destructive'}
            className="px-3 py-1"
          >
            {healthStatus.status === 'healthy' && <CheckCircle className="h-4 w-4 mr-1" />}
            {healthStatus.status === 'warning' && <AlertTriangle className="h-4 w-4 mr-1" />}
            {healthStatus.status === 'critical' && <AlertTriangle className="h-4 w-4 mr-1" />}
            System {healthStatus.status === 'healthy' ? 'Healthy' : 
                   healthStatus.status === 'warning' ? 'Needs Attention' : 'Critical'}
          </Badge>
          <Button onClick={refetch} variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* System Health Alerts */}
      {healthStatus.issues.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {healthStatus.issues.map((issue, index) => (
                <li key={index} className="text-sm text-yellow-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                  {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="dashboard-card border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-800">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(metrics.totalRevenueUSD)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {metrics.transactionCount} transactions • {formatPercentage(metrics.profitMargin)} margin
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-800">
              <Target className="h-4 w-4" />
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
              {formatCurrency(metrics.netProfit)}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              After fees: {formatCurrency(metrics.stripeFees)} + costs: {formatCurrency(metrics.teacherCosts)}
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-purple-800">
              <TrendingUp className="h-4 w-4" />
              Growth Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.monthlyGrowth >= 15 ? 'text-purple-700' : 'text-orange-600'}`}>
              {formatPercentage(metrics.monthlyGrowth)}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Target: 15% • Status: {metrics.monthlyGrowth >= 15 ? 'On Track' : 'Below Target'}
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800">
              <Users className="h-4 w-4" />
              System Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {systemMetrics.totalUsers}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              {systemMetrics.activeTeachers} teachers • {systemMetrics.pendingApprovals} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4" />
              Active Packages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{packages.filter(p => p.is_active).length}</div>
            <p className="text-xs text-muted-foreground">of {packages.length} total packages</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4" />
              Currencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currencies.filter(c => c.is_enabled).length}</div>
            <p className="text-xs text-muted-foreground">payment options enabled</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{systemMetrics.completedSessions}</div>
            <p className="text-xs text-muted-foreground">of {systemMetrics.totalSessions} scheduled</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.conversionRate >= 65 ? 'text-green-600' : 'text-orange-600'}`}>
              {formatPercentage(metrics.conversionRate)}
            </div>
            <p className="text-xs text-muted-foreground">trial-to-paid conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Business Intelligence Dashboard */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Business Intelligence & Analytics
        </h2>
        <BusinessIntelligenceDashboard />
      </div>

      {/* Quick Actions */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Quick Administrative Actions</CardTitle>
          <CardDescription>
            Common administrative tasks and system management shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="font-medium">User Management</span>
              <span className="text-xs text-muted-foreground">Manage approvals & roles</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Settings className="h-5 w-5" />
              <span className="font-medium">System Config</span>
              <span className="text-xs text-muted-foreground">Modify settings & rules</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span className="font-medium">Financial Reports</span>
              <span className="text-xs text-muted-foreground">View detailed analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHomepage;
