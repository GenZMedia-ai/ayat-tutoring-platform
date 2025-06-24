
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Calendar, Globe, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface AnalyticsData {
  conversionRate: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'same';
  };
  teacherTypeConversions: Array<{
    type: string;
    conversions: number;
    trials: number;
    rate: number;
  }>;
  totalTrials: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    previousComparisons: {
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
  };
  activePipeline: {
    pending: number;
    awaitingConfirmation: number;
    trialCompleted: number;
  };
  bookingByCountry: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;
  ghostRate: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'same';
  };
}

const SalesAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('thismonth');

  // Get date range based on filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        return { from: now, to: now };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { from: yesterday, to: yesterday };
      case 'last7days':
        return { from: subDays(now, 7), to: now };
      case 'thismonth':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'lastmonth':
        const lastMonth = subDays(startOfMonth(now), 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      case 'alltime':
        return { from: new Date('2024-01-01'), to: now };
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  };

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { from, to } = getDateRange();
        const fromStr = format(from, 'yyyy-MM-dd');
        const toStr = format(to, 'yyyy-MM-dd');

        // Get previous period for comparisons
        const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
        const previousFrom = subDays(from, daysDiff);
        const previousFromStr = format(previousFrom, 'yyyy-MM-dd');
        const previousToStr = format(subDays(to, daysDiff), 'yyyy-MM-dd');

        // Current period data
        const [
          { data: currentTrials },
          { data: currentPaid },
          { data: currentGhosted },
          { data: teacherTypes },
          { data: countries },
          { data: pipeline }
        ] = await Promise.all([
          // Current trials
          supabase
            .from('students')
            .select('*')
            .eq('assigned_sales_agent_id', user.id)
            .gte('created_at', fromStr)
            .lte('created_at', toStr + 'T23:59:59'),
          
          // Current paid students
          supabase
            .from('students')
            .select('*')
            .eq('assigned_sales_agent_id', user.id)
            .eq('status', 'paid')
            .gte('created_at', fromStr)
            .lte('created_at', toStr + 'T23:59:59'),
          
          // Current ghosted trials  
          supabase
            .from('students')
            .select('*')
            .eq('assigned_sales_agent_id', user.id)
            .eq('status', 'trial-ghosted')
            .gte('created_at', fromStr)
            .lte('created_at', toStr + 'T23:59:59'),

          // Teacher type data
          supabase
            .from('students')
            .select('teacher_type, status')
            .eq('assigned_sales_agent_id', user.id)
            .gte('created_at', fromStr)
            .lte('created_at', toStr + 'T23:59:59'),

          // Country data
          supabase
            .from('students')
            .select('country')
            .eq('assigned_sales_agent_id', user.id)
            .gte('created_at', fromStr)
            .lte('created_at', toStr + 'T23:59:59'),

          // Active pipeline
          supabase
            .from('students')
            .select('status')
            .eq('assigned_sales_agent_id', user.id)
            .in('status', ['pending', 'confirmed', 'trial-completed'])
        ]);

        // Previous period data for comparison
        const [
          { data: previousTrials },
          { data: previousPaid },
          { data: previousGhosted }
        ] = await Promise.all([
          supabase
            .from('students')
            .select('*')
            .eq('assigned_sales_agent_id', user.id)
            .gte('created_at', previousFromStr)
            .lte('created_at', previousToStr + 'T23:59:59'),
          
          supabase
            .from('students')
            .select('*')
            .eq('assigned_sales_agent_id', user.id)
            .eq('status', 'paid')
            .gte('created_at', previousFromStr)
            .lte('created_at', previousToStr + 'T23:59:59'),

          supabase
            .from('students')
            .select('*')
            .eq('assigned_sales_agent_id', user.id)
            .eq('status', 'trial-ghosted')
            .gte('created_at', previousFromStr)
            .lte('created_at', previousToStr + 'T23:59:59')
        ]);

        // Calculate conversion rates
        const currentCompletedTrials = (currentTrials || []).filter(t => 
          ['trial-completed', 'paid', 'active', 'expired'].includes(t.status)
        ).length;
        const currentConversionRate = currentCompletedTrials > 0 
          ? Math.round(((currentPaid || []).length / currentCompletedTrials) * 100) 
          : 0;

        const previousCompletedTrials = (previousTrials || []).filter(t => 
          ['trial-completed', 'paid', 'active', 'expired'].includes(t.status)
        ).length;
        const previousConversionRate = previousCompletedTrials > 0 
          ? Math.round(((previousPaid || []).length / previousCompletedTrials) * 100) 
          : 0;

        // Process teacher type conversions
        const teacherTypeData = (teacherTypes || []).reduce((acc, student) => {
          const type = student.teacher_type || 'mixed';
          if (!acc[type]) {
            acc[type] = { trials: 0, conversions: 0 };
          }
          acc[type].trials++;
          if (student.status === 'paid') {
            acc[type].conversions++;
          }
          return acc;
        }, {} as Record<string, { trials: number; conversions: number }>);

        const teacherTypeConversions = Object.entries(teacherTypeData).map(([type, data]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          trials: data.trials,
          conversions: data.conversions,
          rate: data.trials > 0 ? Math.round((data.conversions / data.trials) * 100) : 0
        }));

        // Process country data
        const countryData = (countries || []).reduce((acc, student) => {
          const country = student.country || 'Unknown';
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const totalStudents = (countries || []).length;
        const bookingByCountry = Object.entries(countryData)
          .map(([country, count]) => ({
            country,
            count,
            percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Calculate ghost rate
        const currentTotalTrials = (currentTrials || []).length;
        const currentGhostRate = currentTotalTrials > 0 
          ? Math.round(((currentGhosted || []).length / currentTotalTrials) * 100) 
          : 0;

        const previousTotalTrials = (previousTrials || []).length;
        const previousGhostRate = previousTotalTrials > 0 
          ? Math.round(((previousGhosted || []).length / previousTotalTrials) * 100) 
          : 0;

        const analyticsData: AnalyticsData = {
          conversionRate: {
            current: currentConversionRate,
            previous: previousConversionRate,
            trend: currentConversionRate > previousConversionRate ? 'up' : 
                   currentConversionRate < previousConversionRate ? 'down' : 'same'
          },
          teacherTypeConversions,
          totalTrials: {
            today: (currentTrials || []).filter(t => 
              format(new Date(t.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
            ).length,
            thisWeek: (currentTrials || []).filter(t => {
              const trialDate = new Date(t.created_at);
              return trialDate >= subDays(new Date(), 7);
            }).length,
            thisMonth: (currentTrials || []).length,
            previousComparisons: {
              today: 0, // Would need more complex calculation
              thisWeek: 0, // Would need more complex calculation  
              thisMonth: (previousTrials || []).length
            }
          },
          activePipeline: {
            pending: (pipeline || []).filter(p => p.status === 'pending').length,
            awaitingConfirmation: (pipeline || []).filter(p => p.status === 'confirmed').length,
            trialCompleted: (pipeline || []).filter(p => p.status === 'trial-completed').length
          },
          bookingByCountry,
          ghostRate: {
            current: currentGhostRate,
            previous: previousGhostRate,
            trend: currentGhostRate < previousGhostRate ? 'up' : 
                   currentGhostRate > previousGhostRate ? 'down' : 'same'
          }
        };

        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error loading analytics:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [dateFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sales Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Analyze conversion rates, performance trends, and pipeline insights
          </p>
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last7days">Last 7 Days</SelectItem>
            <SelectItem value="thismonth">This Month</SelectItem>
            <SelectItem value="lastmonth">Last Month</SelectItem>
            <SelectItem value="alltime">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Conversion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Trial to Paid Conversion Rate
              {analytics.conversionRate.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : analytics.conversionRate.trend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{analytics.conversionRate.current}%</div>
            <p className="text-xs text-muted-foreground">
              Previous: {analytics.conversionRate.previous}% 
              {analytics.conversionRate.current >= 65 && (
                <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Target Met</Badge>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Total Trials */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Trials Booked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Today:</span>
                <span className="font-semibold">{analytics.totalTrials.today}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">This Week:</span>
                <span className="font-semibold">{analytics.totalTrials.thisWeek}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">This Month:</span>
                <span className="font-semibold">{analytics.totalTrials.thisMonth}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ghost Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Ghost Rate
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analytics.ghostRate.current}%</div>
            <p className="text-xs text-muted-foreground">
              Previous: {analytics.ghostRate.previous}%
              {analytics.ghostRate.trend === 'up' && (
                <span className="text-green-600 ml-1">↓ Improving</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teacher Type Conversions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversion by Teacher Type</CardTitle>
            <CardDescription>Which teacher types convert best</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.teacherTypeConversions.map((type) => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{type.type}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{type.rate}%</div>
                    <div className="text-xs text-muted-foreground">
                      {type.conversions}/{type.trials}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Pipeline</CardTitle>
            <CardDescription>Real-time counts of students in process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Trials</span>
                <Badge variant="outline">{analytics.activePipeline.pending}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Awaiting Confirmation</span>
                <Badge variant="outline">{analytics.activePipeline.awaitingConfirmation}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trial Completed</span>
                <Badge className="bg-green-100 text-green-800">{analytics.activePipeline.trialCompleted}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking by Country */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Booking by Country
          </CardTitle>
          <CardDescription>Distribution of students by timezone/country</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.bookingByCountry.map((country) => (
              <div key={country.country} className="flex items-center justify-between">
                <span className="font-medium">{country.country}</span>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">{country.count} students</div>
                  <Badge variant="outline">{country.percentage}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesAnalytics;
