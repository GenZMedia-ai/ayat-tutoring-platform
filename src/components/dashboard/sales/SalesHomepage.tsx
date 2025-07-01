
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { TrendingUp, TrendingDown, Users, Calendar, Phone, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface StatsData {
  totalTrials: number;
  conversions: number;
  conversionRate: number;
  pendingTrials: number;
  confirmedTrials: number;
  completedTrials: number;
  awaitingPayment: number;
  paidStudents: number;
  activeStudents: number;
  ghostedTrials: number;
  previousStats: {
    totalTrials: number;
    conversions: number;
    conversionRate: number;
  };
}

const SalesHomepage: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('thismonth');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const { user } = useAuth();

  // Get date range based on filter
  const getDateRange = () => {
    const now = new Date();
    if (dateFilter === 'custom' && customDateRange?.from && customDateRange?.to) {
      return { from: customDateRange.from, to: customDateRange.to };
    }
    
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
      default:
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  };

  // Load sales statistics
  const loadStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { from, to } = getDateRange();
      const fromStr = format(from, 'yyyy-MM-dd');
      const toStr = format(to, 'yyyy-MM-dd');

      // Get previous period for comparison
      const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
      const previousFrom = subDays(from, daysDiff);
      const previousFromStr = format(previousFrom, 'yyyy-MM-dd');
      const previousToStr = format(subDays(to, daysDiff), 'yyyy-MM-dd');

      // Current period data
      const [
        { data: currentTrials },
        { data: previousTrials }
      ] = await Promise.all([
        supabase
          .from('students')
          .select('*')
          .eq('assigned_sales_agent_id', user.id)
          .gte('created_at', fromStr)
          .lte('created_at', toStr + 'T23:59:59'),
        
        supabase
          .from('students')
          .select('*')
          .eq('assigned_sales_agent_id', user.id)
          .gte('created_at', previousFromStr)
          .lte('created_at', previousToStr + 'T23:59:59')
      ]);

      const trials = currentTrials || [];
      const prevTrials = previousTrials || [];

      // Calculate current stats
      const totalTrials = trials.length;
      const conversions = trials.filter(t => t.status === 'paid').length;
      const conversionRate = totalTrials > 0 ? Math.round((conversions / totalTrials) * 100) : 0;

      // Count by status
      const pendingTrials = trials.filter(t => t.status === 'pending').length;
      const confirmedTrials = trials.filter(t => t.status === 'confirmed').length;
      const completedTrials = trials.filter(t => t.status === 'trial-completed').length;
      const awaitingPayment = trials.filter(t => t.status === 'awaiting-payment').length;
      const paidStudents = trials.filter(t => t.status === 'paid').length;
      const activeStudents = trials.filter(t => t.status === 'active').length;
      const ghostedTrials = trials.filter(t => t.status === 'trial-ghosted').length;

      // Calculate previous stats
      const prevTotalTrials = prevTrials.length;
      const prevConversions = prevTrials.filter(t => t.status === 'paid').length;
      const prevConversionRate = prevTotalTrials > 0 ? Math.round((prevConversions / prevTotalTrials) * 100) : 0;

      setStats({
        totalTrials,
        conversions,
        conversionRate,
        pendingTrials,
        confirmedTrials,
        completedTrials,
        awaitingPayment,
        paidStudents,
        activeStudents,
        ghostedTrials,
        previousStats: {
          totalTrials: prevTotalTrials,
          conversions: prevConversions,
          conversionRate: prevConversionRate
        }
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user, dateFilter, customDateRange]);

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading sales overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sales Overview</h3>
          <p className="text-sm text-muted-foreground">
            Track your performance and conversion metrics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
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
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          {dateFilter === 'custom' && (
            <DatePickerWithRange
              date={customDateRange}
              onDateChange={setCustomDateRange}
            />
          )}
          
          <Button onClick={loadStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Total Trials
              {getTrendIcon(stats?.totalTrials || 0, stats?.previousStats.totalTrials || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalTrials || 0}</div>
            <p className="text-xs text-muted-foreground">
              Previous: {stats?.previousStats.totalTrials || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Conversion Rate
              {getTrendIcon(stats?.conversionRate || 0, stats?.previousStats.conversionRate || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Previous: {stats?.previousStats.conversionRate || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats?.paidStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Successfully converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{stats?.activeStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently learning
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Pipeline View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Trial Pipeline
            </CardTitle>
            <CardDescription>Current trials in progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  {stats?.pendingTrials || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Confirmed</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {stats?.confirmedTrials || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {stats?.completedTrials || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ghosted</span>
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  {stats?.ghostedTrials || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Payment Status
            </CardTitle>
            <CardDescription>Student payment progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Awaiting Payment</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  {stats?.awaitingPayment || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Paid</span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                  {stats?.paidStudents || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active</span>
                <Badge variant="outline" className="bg-cyan-50 text-cyan-700">
                  {stats?.activeStudents || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common sales tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                View Trial Appointments
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Manage Payment Links
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Follow-up Tasks
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesHomepage;
