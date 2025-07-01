
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Users, Phone, RefreshCw } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/sales/DateRangePicker';
import { useMixedStudentData } from '@/hooks/useMixedStudentData';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudent } from '@/types/trial';

const SalesHomepage: React.FC = () => {
  const { items, loading, refetchData } = useMixedStudentData();
  const [dateFilter, setDateFilter] = useState('today');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

  // Filter items based on date
  const getFilteredItems = () => {
    const now = new Date();
    
    return items.filter(item => {
      const createdAt = item.type === 'individual' 
        ? parseISO((item.data as TrialSessionFlowStudent).createdAt)
        : parseISO((item.data as FamilyGroup).created_at);

      switch (dateFilter) {
        case 'today':
          return format(createdAt, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          return format(createdAt, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd');
        case 'thisweek':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          return createdAt >= startOfWeek;
        case 'thismonth':
          return format(createdAt, 'yyyy-MM') === format(now, 'yyyy-MM');
        case 'custom':
          if (!customDateRange?.from) return true;
          if (!customDateRange.to) return createdAt >= customDateRange.from;
          return isWithinInterval(createdAt, {
            start: customDateRange.from,
            end: customDateRange.to
          });
        default:
          return true;
      }
    });
  };

  const filteredItems = getFilteredItems();

  // Calculate statistics
  const stats = {
    total: filteredItems.length,
    pending: filteredItems.filter(item => item.data.status === 'pending').length,
    confirmed: filteredItems.filter(item => item.data.status === 'confirmed').length,
    trialCompleted: filteredItems.filter(item => item.data.status === 'trial-completed').length,
    followUp: filteredItems.filter(item => item.data.status === 'follow-up').length,
    awaitingPayment: filteredItems.filter(item => item.data.status === 'awaiting-payment').length,
    paid: filteredItems.filter(item => item.data.status === 'paid').length,
    active: filteredItems.filter(item => item.data.status === 'active').length,
    dropped: filteredItems.filter(item => item.data.status === 'dropped').length,
  };

  const conversionRate = stats.trialCompleted > 0 
    ? Math.round((stats.paid / stats.trialCompleted) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">Sales Overview</h3>
          <p className="text-sm text-muted-foreground">
            Track your trial bookings, conversions, and revenue pipeline
          </p>
        </div>
        <Button 
          onClick={refetchData} 
          variant="outline" 
          size="sm"
          className="border-primary/30 text-primary hover:bg-primary/5"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Date Filter Controls */}
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Filter by Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48 border-primary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="thisweek">This Week</SelectItem>
                <SelectItem value="thismonth">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            
            {dateFilter === 'custom' && (
              <DateRangePicker
                dateRange={customDateRange}
                onDateRangeChange={setCustomDateRange}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Trials</p>
                <p className="text-3xl font-bold text-primary">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-3xl font-bold text-green-600">{conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid Students</p>
                <p className="text-3xl font-bold text-purple-600">{stats.paid}</p>
              </div>
              <Badge className="bg-purple-100 text-purple-800">Revenue</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                <p className="text-3xl font-bold text-blue-600">{stats.active}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Ongoing</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trial Pipeline</CardTitle>
            <CardDescription>Current status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pending Confirmation</span>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {stats.pending}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confirmed Trials</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {stats.confirmed}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Trial Completed</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {stats.trialCompleted}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Follow-up Scheduled</span>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {stats.followUp}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Pipeline</CardTitle>
            <CardDescription>Revenue tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Awaiting Payment</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  {stats.awaitingPayment}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Paid Students</span>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {stats.paid}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Sessions</span>
                <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200">
                  {stats.active}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dropped Out</span>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {stats.dropped}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>
            {dateFilter === 'custom' && customDateRange?.from && customDateRange?.to
              ? `Showing data from ${format(customDateRange.from, 'MMM dd, yyyy')} to ${format(customDateRange.to, 'MMM dd, yyyy')}`
              : `Showing ${dateFilter} data`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="justify-start border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => window.location.href = '/sales/trials'}
            >
              <Phone className="h-4 w-4 mr-2" />
              Contact Pending ({stats.pending})
            </Button>
            <Button 
              variant="outline" 
              className="justify-start border-green-300 text-green-700 hover:bg-green-50"
              onClick={() => window.location.href = '/sales/trials?status=trial-completed'}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Process Completed ({stats.trialCompleted})
            </Button>
            <Button 
              variant="outline" 
              className="justify-start border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => window.location.href = '/sales/followup'}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Follow-up Tasks ({stats.followUp})
            </Button>
            <Button 
              variant="outline" 
              className="justify-start border-purple-300 text-purple-700 hover:bg-purple-50"
              onClick={() => window.location.href = '/sales/payment-links'}
            >
              <Users className="h-4 w-4 mr-2" />
              Payment Links ({stats.awaitingPayment})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesHomepage;
