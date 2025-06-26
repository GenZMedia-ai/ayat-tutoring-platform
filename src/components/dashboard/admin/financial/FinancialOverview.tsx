
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFinancialData } from '@/hooks/useFinancialData';
import { DollarSign, TrendingUp, CreditCard, Target, Coins, Calculator, AlertCircle } from 'lucide-react';

const FinancialOverview: React.FC = () => {
  const { metrics, loading, error } = useFinancialData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (error) {
    return (
      <Card className="dashboard-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Error loading financial data: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
              <div className="p-2 rounded-full bg-green-50">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.totalRevenueUSD)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              From {metrics.transactionCount} transactions
            </p>
          </CardContent>
        </Card>

        {/* Stripe Fees */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Stripe Fees</span>
              <div className="p-2 rounded-full bg-orange-50">
                <CreditCard className="h-4 w-4 text-orange-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(metrics.stripeFees)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              2.9% + $0.30 per transaction
            </p>
          </CardContent>
        </Card>

        {/* Teacher Costs */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Teacher Costs</span>
              <div className="p-2 rounded-full bg-blue-50">
                <Coins className="h-4 w-4 text-blue-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(metrics.teacherCosts)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              100 EGP per hour taught
            </p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Net Profit</span>
              <div className="p-2 rounded-full bg-primary/10">
                <Calculator className="h-4 w-4 text-primary" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-primary' : 'text-red-600'}`}>
              {formatCurrency(metrics.netProfit)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Revenue - Fees - Costs
            </p>
          </CardContent>
        </Card>

        {/* Monthly Growth */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Monthly Growth</span>
              <div className="p-2 rounded-full bg-purple-50">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className={`text-2xl font-bold ${metrics.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(metrics.monthlyGrowth)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={metrics.monthlyGrowth >= 15 ? "default" : "secondary"} className="text-xs">
                Target: 15%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Average Transaction */}
        <Card className="dashboard-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Avg Transaction</span>
              <div className="p-2 rounded-full bg-gray-50">
                <Target className="h-4 w-4 text-gray-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold text-gray-700">
              {formatCurrency(metrics.averageTransactionSize)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Per payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Financial Breakdown</CardTitle>
          <CardDescription>
            Comprehensive overview of revenue, costs, and profitability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-primary">Revenue Stream</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Gross Revenue:</span>
                    <span className="font-medium text-green-600">{formatCurrency(metrics.totalRevenueUSD)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction Count:</span>
                    <span className="font-medium">{metrics.transactionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average per Transaction:</span>
                    <span className="font-medium">{formatCurrency(metrics.averageTransactionSize)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-primary">Cost Structure</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Stripe Processing Fees:</span>
                    <span className="font-medium text-orange-600">{formatCurrency(metrics.stripeFees)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Teacher Compensation:</span>
                    <span className="font-medium text-blue-600">{formatCurrency(metrics.teacherCosts)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Net Profit:</span>
                    <span className={`font-bold ${metrics.netProfit >= 0 ? 'text-primary' : 'text-red-600'}`}>
                      {formatCurrency(metrics.netProfit)}
                    </span>
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

export default FinancialOverview;
