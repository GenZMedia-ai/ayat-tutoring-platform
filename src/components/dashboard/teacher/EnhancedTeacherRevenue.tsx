
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateFilter, DateRange } from '@/components/teacher/DateFilter';
import { useTeacherRevenue } from '@/hooks/useTeacherRevenue';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { Clock, DollarSign, Gift, TrendingUp } from 'lucide-react';

const EnhancedTeacherRevenue: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('this-month');
  const { revenue, loading } = useTeacherRevenue(dateRange);

  const revenueCards = [
    {
      title: 'Taught Hours',
      value: loading ? '-' : `${revenue.taughtHours}h`,
      description: 'Total hours completed',
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Earnings',
      value: loading ? '-' : `${revenue.earnings.toLocaleString()} EGP`,
      description: `${revenue.taughtHours}h × 100 EGP`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Bonus',
      value: loading ? '-' : `${revenue.bonus.toLocaleString()} EGP`,
      description: 'Admin-added bonus',
      icon: Gift,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'Total Earnings',
      value: loading ? '-' : `${revenue.totalEarnings.toLocaleString()} EGP`,
      description: 'Earnings + Bonus',
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10'
    }
  ];

  const getDateRangeLabel = (range: DateRange) => {
    switch (range) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'last-7-days': return 'Last 7 Days';
      case 'this-month': return 'This Month';
      case 'last-month': return 'Last Month';
      case 'all-time': return 'All Time';
      default: return 'Selected Period';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Revenue Analytics</h1>
          <p className="text-muted-foreground">
            Track your earnings and payment history for {getDateRangeLabel(dateRange).toLowerCase()}
          </p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueCards.map((card) => (
          <Card key={card.title} className="dashboard-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                <div className={`p-2 rounded-full ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Breakdown */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>
            Detailed earnings information for {getDateRangeLabel(dateRange).toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-muted-foreground">Loading revenue details...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Hours Taught</span>
                  <span className="font-bold text-blue-600">{revenue.taughtHours}h</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Rate per Hour</span>
                  <span className="font-bold text-green-600">100 EGP</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Base Earnings</span>
                  <span className="font-bold">{revenue.earnings.toLocaleString()} EGP</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium">Performance Bonus</span>
                  <span className="font-bold text-purple-600">{revenue.bonus.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border-2 border-primary/20">
                  <span className="font-medium text-lg">Total Earnings</span>
                  <span className="font-bold text-xl text-primary">{revenue.totalEarnings.toLocaleString()} EGP</span>
                </div>
                {revenue.bonus === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Performance bonuses are added by administrators
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedTeacherRevenue;
