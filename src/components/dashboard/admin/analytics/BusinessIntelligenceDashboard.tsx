
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAdvancedFinancialData } from '@/hooks/useAdvancedFinancialData';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Award, 
  DollarSign, 
  BookOpen, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const BusinessIntelligenceDashboard: React.FC = () => {
  const { metrics, systemMetrics, loading, error } = useAdvancedFinancialData();

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

  const getStatusColor = (value: number, target: number, isPercentage = false) => {
    const threshold = isPercentage ? target : target * 0.8;
    if (value >= target) return 'text-green-600';
    if (value >= threshold) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <p>Error loading business intelligence data: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Growth */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Monthly Growth</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-2xl font-bold ${getStatusColor(metrics.monthlyGrowth, 15)}`}>
              {formatPercentage(metrics.monthlyGrowth)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress 
                value={Math.min((metrics.monthlyGrowth / 15) * 100, 100)} 
                className="flex-1" 
              />
              <Badge variant={metrics.monthlyGrowth >= 15 ? "default" : "destructive"} className="text-xs">
                Target: 15%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Utilization */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Teacher Utilization</span>
              <Users className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-2xl font-bold ${getStatusColor(metrics.teacherUtilization, 80)}`}>
              {formatPercentage(metrics.teacherUtilization)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress 
                value={Math.min(metrics.teacherUtilization, 100)} 
                className="flex-1"
              />
              <Badge variant={metrics.teacherUtilization >= 80 ? "default" : "destructive"} className="text-xs">
                Target: 80%+
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Trial-to-Paid</span>
              <Target className="h-4 w-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-2xl font-bold ${getStatusColor(metrics.conversionRate, 65)}`}>
              {formatPercentage(metrics.conversionRate)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress 
                value={Math.min((metrics.conversionRate / 65) * 100, 100)} 
                className="flex-1"
              />
              <Badge variant={metrics.conversionRate >= 65 ? "default" : "destructive"} className="text-xs">
                Target: 65%+
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Profit Margin */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Profit Margin</span>
              <Award className="h-4 w-4 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-2xl font-bold ${getStatusColor(metrics.profitMargin, 70)}`}>
              {formatPercentage(metrics.profitMargin)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress 
                value={Math.min((metrics.profitMargin / 70) * 100, 100)} 
                className="flex-1"
              />
              <Badge variant={metrics.profitMargin >= 70 ? "default" : "secondary"} className="text-xs">
                Target: 70%+
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.totalRevenueUSD)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              From {metrics.transactionCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Active Users</span>
              <Users className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-600">
              {systemMetrics.totalUsers}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {systemMetrics.pendingApprovals} pending approval
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Sessions</span>
              <BookOpen className="h-4 w-4 text-orange-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-orange-600">
              {systemMetrics.completedSessions}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              of {systemMetrics.totalSessions} scheduled
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Net Profit</span>
              <CheckCircle className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-primary' : 'text-red-600'}`}>
              {formatCurrency(metrics.netProfit)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              After all expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Business Performance Analysis</CardTitle>
          <CardDescription>
            Comprehensive overview of key performance indicators and business metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-primary">Financial Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Revenue Growth (MoM)</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${getStatusColor(metrics.monthlyGrowth, 15)}`}>
                        {formatPercentage(metrics.monthlyGrowth)}
                      </span>
                      <Badge variant={metrics.monthlyGrowth >= 15 ? "default" : "destructive"}>
                        {metrics.monthlyGrowth >= 15 ? 'On Track' : 'Below Target'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Profit Margin</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${getStatusColor(metrics.profitMargin, 70)}`}>
                        {formatPercentage(metrics.profitMargin)}
                      </span>
                      <Badge variant={metrics.profitMargin >= 70 ? "default" : "secondary"}>
                        {metrics.profitMargin >= 70 ? 'Excellent' : 'Good'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Transaction</span>
                    <span className="font-medium">{formatCurrency(metrics.averageTransactionSize)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-primary">Operational Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Teacher Utilization</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${getStatusColor(metrics.teacherUtilization, 80)}`}>
                        {formatPercentage(metrics.teacherUtilization)}
                      </span>
                      <Badge variant={metrics.teacherUtilization >= 80 ? "default" : "destructive"}>
                        {metrics.teacherUtilization >= 80 ? 'Optimal' : 'Needs Improvement'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Trial Conversion</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${getStatusColor(metrics.conversionRate, 65)}`}>
                        {formatPercentage(metrics.conversionRate)}
                      </span>
                      <Badge variant={metrics.conversionRate >= 65 ? "default" : "destructive"}>
                        {metrics.conversionRate >= 65 ? 'Strong' : 'Needs Focus'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Teachers</span>
                    <span className="font-medium">{systemMetrics.activeTeachers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessIntelligenceDashboard;
