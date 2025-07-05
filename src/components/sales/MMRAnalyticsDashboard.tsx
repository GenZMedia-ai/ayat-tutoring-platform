import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMMRAnalytics } from '@/hooks/useMMRAnalytics';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Users,
  Repeat,
  BarChart3,
  Calendar
} from 'lucide-react';

const MMRAnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { analytics, loading, refreshAnalytics } = useMMRAnalytics();

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(0)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return TrendingUp;
    if (growth < 0) return TrendingDown;
    return BarChart3;
  };

  if (loading) {
    return (
      <Card className="dashboard-card">
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className={`ml-2 text-muted-foreground ${isRTL ? 'mr-2 ml-0' : ''}`}>
            Loading MMR analytics...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="dashboard-card">
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Unable to load MMR analytics</p>
          <Button
            size="sm"
            variant="outline"
            onClick={refreshAnalytics}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const GrowthIcon = getGrowthIcon(analytics.netMRRGrowth);

  return (
    <Card className="dashboard-card">
      <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
        <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <BarChart3 className="h-5 w-5 text-primary" />
          Monthly Recurring Revenue (MRR) Analytics
        </CardTitle>
        <CardDescription>
          Real-time revenue insights with cycle tracking and growth analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Main MRR Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total MRR */}
          <div className="p-4 border border-border rounded-lg bg-primary/5">
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Total MRR</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalMRR)}</div>
            <div className="text-xs text-muted-foreground">Current monthly revenue</div>
          </div>

          {/* New Customer MRR */}
          <div className="p-4 border border-border rounded-lg">
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">New Customer MRR</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(analytics.newCustomerMRR)}</div>
            <div className="text-xs text-muted-foreground">First-time subscriptions</div>
          </div>

          {/* Renewal MRR */}
          <div className="p-4 border border-border rounded-lg">
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Repeat className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Renewal MRR</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(analytics.renewalMRR)}</div>
            <div className="text-xs text-muted-foreground">Subscription renewals</div>
          </div>

          {/* Net MRR Growth */}
          <div className="p-4 border border-border rounded-lg">
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <GrowthIcon className={`h-4 w-4 ${getGrowthColor(analytics.netMRRGrowth)}`} />
              <span className={`text-sm font-medium ${getGrowthColor(analytics.netMRRGrowth)}`}>
                Net MRR Growth
              </span>
            </div>
            <div className={`text-2xl font-bold ${getGrowthColor(analytics.netMRRGrowth)}`}>
              {analytics.netMRRGrowth >= 0 ? '+' : ''}{formatCurrency(analytics.netMRRGrowth)}
            </div>
            <div className="text-xs text-muted-foreground">Monthly growth rate</div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Renewal Rate */}
          <div className="p-4 border border-border rounded-lg">
            <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Repeat className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Renewal Rate</span>
              </div>
              <Badge variant={analytics.renewalRate >= 70 ? 'default' : analytics.renewalRate >= 50 ? 'secondary' : 'outline'}>
                {analytics.renewalRate >= 70 ? 'Excellent' : analytics.renewalRate >= 50 ? 'Good' : 'Needs Work'}
              </Badge>
            </div>
            <div className="text-3xl font-bold">{formatPercentage(analytics.renewalRate)}</div>
            <div className="text-xs text-muted-foreground">Customer retention success</div>
          </div>

          {/* Revenue Breakdown */}
          <div className="p-4 border border-border rounded-lg">
            <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Revenue Composition</span>
            </div>
            <div className="space-y-2">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm text-muted-foreground">New Customers</span>
                <span className="text-sm font-medium">
                  {analytics.totalMRR > 0 ? ((analytics.newCustomerMRR / analytics.totalMRR) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm text-muted-foreground">Renewals</span>
                <span className="text-sm font-medium">
                  {analytics.totalMRR > 0 ? ((analytics.renewalMRR / analytics.totalMRR) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 text-sm text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="h-4 w-4" />
              <span>Last updated: {new Date(analytics.calculatedAt).toLocaleString()}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={refreshAnalytics}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MMRAnalyticsDashboard;