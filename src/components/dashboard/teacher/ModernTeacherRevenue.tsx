
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateFilter, DateRange } from '@/components/teacher/DateFilter';
import { useTeacherRevenue } from '@/hooks/useTeacherRevenue';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { Clock, DollarSign, Gift, TrendingUp, Target, Award } from 'lucide-react';

const ModernTeacherRevenue: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('this-month');
  const { revenue, loading } = useTeacherRevenue(dateRange);

  const revenueCards = [
    {
      title: 'Teaching Hours',
      value: loading ? '-' : `${revenue.taughtHours}h`,
      description: 'Total hours completed',
      icon: Clock,
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Base Earnings',
      value: loading ? '-' : `${revenue.earnings.toLocaleString()} EGP`,
      description: `${revenue.taughtHours}h × 100 EGP/hour`,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-green-600',
      bgGradient: 'from-emerald-50 to-green-50',
      textColor: 'text-emerald-700'
    },
    {
      title: 'Performance Bonus',
      value: loading ? '-' : `${revenue.bonus.toLocaleString()} EGP`,
      description: 'Admin-awarded bonus',
      icon: Gift,
      gradient: 'from-purple-500 to-indigo-600',
      bgGradient: 'from-purple-50 to-indigo-50',
      textColor: 'text-purple-700'
    },
    {
      title: 'Total Earnings',
      value: loading ? '-' : `${revenue.totalEarnings.toLocaleString()} EGP`,
      description: 'Your complete earnings',
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-50 to-red-50',
      textColor: 'text-orange-700'
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

  const progressPercentage = revenue.taughtHours > 0 ? Math.min((revenue.taughtHours / 40) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Revenue Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your earnings and financial progress for {getDateRangeLabel(dateRange).toLowerCase()}
            </p>
          </div>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueCards.map((card) => (
          <Card key={card.title} className={`border-0 shadow-lg bg-gradient-to-br ${card.bgGradient} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gradient-to-r ${card.gradient} rounded-xl shadow-lg`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {card.title}
                  </p>
                </div>
              </div>
              
              {loading ? (
                <div className="flex items-center gap-2 justify-center py-4">
                  <LoadingSpinner />
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className={`text-2xl font-bold ${card.textColor}`}>
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-600">
                    {card.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Breakdown */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              Earnings Breakdown
            </CardTitle>
            <CardDescription>
              Detailed view of your earnings for {getDateRangeLabel(dateRange).toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-muted-foreground">Loading details...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Hours Taught</span>
                  </div>
                  <span className="font-bold text-blue-900 text-lg">{revenue.taughtHours}h</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium text-emerald-900">Hourly Rate</span>
                  </div>
                  <span className="font-bold text-emerald-900 text-lg">100 EGP</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Performance Bonus</span>
                  </div>
                  <span className="font-bold text-purple-900 text-lg">{revenue.bonus.toLocaleString()} EGP</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-300">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-900 text-lg">Total Earnings</span>
                  </div>
                  <span className="font-bold text-orange-900 text-xl">{revenue.totalEarnings.toLocaleString()} EGP</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Tracker */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
              Monthly Progress
            </CardTitle>
            <CardDescription>
              Track your progress towards monthly teaching goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                  {revenue.taughtHours}h
                </div>
                <p className="text-sm text-gray-600">of 40h monthly target</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">Remaining</p>
                  <p className="text-lg font-bold text-green-900">
                    {Math.max(0, 40 - revenue.taughtHours)}h
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">Potential</p>
                  <p className="text-lg font-bold text-blue-900">
                    {Math.max(0, 40 - revenue.taughtHours) * 100} EGP
                  </p>
                </div>
              </div>
              
              {revenue.bonus === 0 && (
                <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800 text-center">
                    💡 <strong>Tip:</strong> Performance bonuses are awarded by administrators based on exceptional teaching quality
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModernTeacherRevenue;
