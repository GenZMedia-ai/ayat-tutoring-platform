
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar, 
  BarChart3,
  Target,
  Clock,
  RefreshCw,
  Download
} from 'lucide-react';
import { useBusinessHealthMetrics } from '@/hooks/useBusinessHealthMetrics';
import { toast } from 'sonner';

const BusinessHealthDashboard: React.FC = () => {
  const { metrics, loading, error, refetchMetrics } = useBusinessHealthMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading business metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load business metrics</p>
          <Button onClick={refetchMetrics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Business Health Dashboard
          </h3>
          <p className="text-sm text-muted-foreground">
            Real-time business metrics and performance indicators
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => toast.info('Export feature coming soon')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={refetchMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {metrics.totalStudents}
              </div>
              <div className="text-sm text-muted-foreground">Total Students</div>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-xs text-green-600">+{metrics.last30DaysGrowth}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${metrics.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
              <div className="text-xs text-muted-foreground mt-1">
                MRR: ${metrics.monthlyRecurringRevenue.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.trialConversionRate}%
              </div>
              <div className="text-sm text-muted-foreground">Trial Conversion</div>
              <div className="text-xs text-muted-foreground mt-1">
                Target: 75%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.activeStudents}
              </div>
              <div className="text-sm text-muted-foreground">Active Students</div>
              <div className="text-xs text-muted-foreground mt-1">
                {metrics.paidStudents} Paid Total
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {metrics.teacherUtilizationRate}%
              </div>
              <div className="text-sm text-muted-foreground">Teacher Utilization</div>
              <div className="text-xs text-muted-foreground mt-1">
                {metrics.avgStudentsPerTeacher} Avg/Teacher
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {metrics.ghostRate}%
              </div>
              <div className="text-sm text-muted-foreground">Ghost Rate</div>
              <div className="text-xs text-muted-foreground mt-1">
                Target: &lt;15%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Business Overview</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Student Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Student Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Active</span>
                  <Badge variant="default">{metrics.statusBreakdown.active}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Paid</span>
                  <Badge variant="default">{metrics.statusBreakdown.paid}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Awaiting Payment</span>
                  <Badge variant="secondary">{metrics.statusBreakdown.awaitingPayment}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Trial Completed</span>
                  <Badge variant="secondary">{metrics.statusBreakdown.trialCompleted}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Confirmed</span>
                  <Badge variant="secondary">{metrics.statusBreakdown.confirmed}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Expired</span>
                  <Badge variant="destructive">{metrics.statusBreakdown.expired}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Teacher Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Teacher Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Kids Teachers</span>
                  <Badge variant="default">{metrics.teacherTypeBreakdown.kids}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Adult Teachers</span>
                  <Badge variant="secondary">{metrics.teacherTypeBreakdown.adult}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Mixed Classes</span>
                  <Badge variant="secondary">{metrics.teacherTypeBreakdown.mixed}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Expert Teachers</span>
                  <Badge variant="default">{metrics.teacherTypeBreakdown.expert}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Financial Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Total Revenue</span>
                  <Badge variant="default">${metrics.totalRevenue.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Monthly Recurring</span>
                  <Badge variant="secondary">${metrics.monthlyRecurringRevenue.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avg Per Student</span>
                  <Badge variant="secondary">${metrics.averageRevenuePerStudent}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Outstanding</span>
                  <Badge variant="destructive">{metrics.outstandingPayments}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Conversion Funnel
                </CardTitle>
                <CardDescription>Student journey through the sales process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="font-medium">Leads → Trials</span>
                  <Badge variant="default">{metrics.statusBreakdown.confirmed + metrics.statusBreakdown.pending}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="font-medium">Trials → Completed</span>
                  <Badge variant="default">{metrics.trialConversionRate}%</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                  <span className="font-medium">Completed → Paid</span>
                  <Badge variant="default">{metrics.paymentConversionRate}%</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                  <span className="font-medium">Ghost Rate</span>
                  <Badge variant="destructive">{metrics.ghostRate}%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Performance Targets
                </CardTitle>
                <CardDescription>Current vs target performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Trial Conversion</span>
                    <span className="text-sm">{metrics.trialConversionRate}% / 75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(metrics.trialConversionRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Teacher Utilization</span>
                    <span className="text-sm">{metrics.teacherUtilizationRate}% / 80%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(metrics.teacherUtilizationRate, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Ghost Rate (Lower is Better)</span>
                    <span className="text-sm">{metrics.ghostRate}% / 15%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${metrics.ghostRate > 15 ? 'bg-red-600' : 'bg-green-600'}`}
                      style={{ width: `${Math.min(metrics.ghostRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Session Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Total Sessions</span>
                  <Badge variant="default">{metrics.totalSessions}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Completed</span>
                  <Badge variant="default">{metrics.completedSessions}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Scheduled</span>
                  <Badge variant="secondary">{metrics.scheduledSessions}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cancelled</span>
                  <Badge variant="destructive">{metrics.cancelledSessions}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Completion Rate</span>
                  <Badge variant="default">{metrics.sessionCompletionRate}%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Growth Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>30-Day Growth</span>
                  <Badge variant="default">+{metrics.last30DaysGrowth}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>7-Day Activity</span>
                  <Badge variant="secondary">+{metrics.last7DaysActivity}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avg Students/Teacher</span>
                  <Badge variant="secondary">{metrics.avgStudentsPerTeacher}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>New Students (30d)</span>
                  <Badge variant="default">{Math.round(metrics.totalStudents * metrics.last30DaysGrowth / 100)}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quality Indicators
                </CardTitle>
                <CardDescription>Key quality and satisfaction metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Quality metrics coming soon</p>
                  <p className="text-sm">This will include student satisfaction, teacher ratings, and session quality scores</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Predictive Analytics
                </CardTitle>
                <CardDescription>Risk indicators and forecasting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <p>Predictive analytics coming soon</p>
                  <p className="text-sm">This will include churn prediction, revenue forecasting, and capacity planning</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessHealthDashboard;
