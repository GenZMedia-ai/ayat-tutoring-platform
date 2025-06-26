
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SmartDateFilter, DateRange } from '@/components/teacher/SmartDateFilter';
import { useTeacherRevenue } from '@/hooks/useTeacherRevenue';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  DollarSign, 
  Gift, 
  TrendingUp, 
  Target,
  Award,
  Banknote,
  Timer
} from 'lucide-react';

const ModernTeacherRevenue: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('this-month');
  const { revenue, loading } = useTeacherRevenue(dateRange);

  const getDateRangeLabel = (range: DateRange) => {
    switch (range) {
      case 'today': return 'Today';
      case 'tomorrow': return 'Tomorrow';
      case 'next-3-days': return 'Next 3 Days';
      case 'this-week': return 'This Week';
      case 'next-7-days': return 'Next 7 Days';
      case 'this-month': return 'This Month';
      case 'last-month': return 'Last Month';
      case 'all-time': return 'All Time';
      default: return 'Selected Period';
    }
  };

  const revenueCards = [
    {
      title: 'Teaching Hours',
      value: loading ? '-' : `${revenue.taughtHours}h`,
      description: 'Hours completed',
      icon: Clock,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    },
    {
      title: 'Base Earnings',
      value: loading ? '-' : `${revenue.earnings.toLocaleString()} EGP`,
      description: `${revenue.taughtHours}h × 100 EGP`,
      icon: Banknote,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700'
    },
    {
      title: 'Performance Bonus',
      value: loading ? '-' : `${revenue.bonus.toLocaleString()} EGP`,
      description: 'Admin-added bonus',
      icon: Gift,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700'
    },
    {
      title: 'Total Revenue',
      value: loading ? '-' : `${revenue.totalEarnings.toLocaleString()} EGP`,
      description: 'Complete earnings',
      icon: TrendingUp,
      gradient: 'from-primary to-secondary',
      bgGradient: 'from-primary/10 to-secondary/10',
      borderColor: 'border-primary/20',
      textColor: 'text-primary',
      isHighlight: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Revenue Analytics
            </h1>
            <p className="text-muted-foreground">
              Track your earnings and performance for {getDateRangeLabel(dateRange).toLowerCase()}
            </p>
          </div>
        </div>
        <SmartDateFilter 
          value={dateRange} 
          onChange={setDateRange}
          showResultCount={false}
        />
      </div>

      {/* Modern Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {revenueCards.map((card) => (
          <Card 
            key={card.title} 
            className={`dashboard-card border-2 ${card.borderColor} bg-gradient-to-br ${card.bgGradient} hover:shadow-lg transition-all duration-300 hover:scale-105`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${card.gradient} shadow-md`}>
                    <card.icon className="h-4 w-4 text-white" />
                  </div>
                  {card.isHighlight && (
                    <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-0">
                      <Award className="h-3 w-3 mr-1" />
                      Total
                    </Badge>
                  )}
                </div>
              </div>
              <CardTitle className={`text-sm font-medium ${card.textColor} mt-2`}>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner />
                  <span className="text-muted-foreground text-sm">Loading...</span>
                </div>
              ) : (
                <>
                  <p className={`text-2xl font-bold ${card.textColor} mb-1`}>
                    {card.value}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Breakdown */}
        <Card className="dashboard-card bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              Earnings Breakdown
            </CardTitle>
            <CardDescription>
              Detailed breakdown for {getDateRangeLabel(dateRange).toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-muted-foreground">Loading breakdown...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-blue-800 flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      Hours Taught
                    </span>
                    <span className="font-bold text-blue-900 text-lg">{revenue.taughtHours}h</span>
                  </div>
                  <Progress value={Math.min((revenue.taughtHours / 40) * 100, 100)} className="h-2" />
                  <p className="text-xs text-blue-600 mt-1">Rate: 100 EGP/hour</p>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-emerald-800 flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Base Earnings
                    </span>
                    <span className="font-bold text-emerald-900 text-lg">{revenue.earnings.toLocaleString()} EGP</span>
                  </div>
                  <Progress value={revenue.earnings > 0 ? 100 : 0} className="h-2" />
                  <p className="text-xs text-emerald-600 mt-1">From completed sessions</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-purple-800 flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Performance Bonus
                    </span>
                    <span className="font-bold text-purple-900 text-lg">{revenue.bonus.toLocaleString()} EGP</span>
                  </div>
                  <Progress value={revenue.bonus > 0 ? 100 : 20} className="h-2" />
                  <p className="text-xs text-purple-600 mt-1">
                    {revenue.bonus === 0 ? 'Added by administrators' : 'Earned bonus'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card className="dashboard-card bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-primary to-secondary rounded-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
              Performance Summary
            </CardTitle>
            <CardDescription>
              Your teaching performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-muted-foreground">Loading performance...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Total Earnings Highlight */}
                <div className="p-6 bg-gradient-to-r from-primary to-secondary rounded-xl text-white shadow-lg">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-90" />
                    <p className="text-sm opacity-90 mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold">{revenue.totalEarnings.toLocaleString()} EGP</p>
                    <p className="text-xs opacity-80 mt-2">
                      For {getDateRangeLabel(dateRange).toLowerCase()}
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Clock className="h-6 w-6 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-primary">{revenue.taughtHours}</p>
                    <p className="text-xs text-muted-foreground">Hours</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <DollarSign className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-emerald-600">100</p>
                    <p className="text-xs text-muted-foreground">EGP/Hour</p>
                  </div>
                </div>

                {revenue.bonus === 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 text-center">
                      💡 Performance bonuses are added by administrators based on your teaching quality
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModernTeacherRevenue;
