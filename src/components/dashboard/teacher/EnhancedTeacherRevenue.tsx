
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateFilter, DateRange } from '@/components/teacher/DateFilter';
import { useTeacherRevenue } from '@/hooks/useTeacherRevenue';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { Clock, DollarSign, Gift, TrendingUp } from 'lucide-react';

const EnhancedTeacherRevenue: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('this-month');
  const { revenue, loading } = useTeacherRevenue(dateRange);
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const revenueCards = [
    {
      title: t('revenue.taughtHours'),
      value: loading ? '-' : `${revenue.taughtHours}h`,
      description: t('revenue.totalHoursCompleted'),
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: t('revenue.earnings'),
      value: loading ? '-' : `${revenue.earnings.toLocaleString()} ${t('revenue.egp')}`,
      description: `${revenue.taughtHours}h × 100 ${t('revenue.egp')}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: t('revenue.bonus'),
      value: loading ? '-' : `${revenue.bonus.toLocaleString()} ${t('revenue.egp')}`,
      description: t('revenue.adminAddedBonus'),
      icon: Gift,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: t('revenue.totalEarnings'),
      value: loading ? '-' : `${revenue.totalEarnings.toLocaleString()} ${t('revenue.egp')}`,
      description: t('revenue.earningsBonus'),
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10'
    }
  ];

  const getDateRangeLabel = (range: DateRange) => {
    return t(`revenue.${range.replace('-', '')}`);
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h1 className="text-2xl font-bold text-primary">{t('revenue.title')}</h1>
          <p className="text-muted-foreground">
            {t('revenue.subtitle')} {getDateRangeLabel(dateRange).toLowerCase()}
          </p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueCards.map((card) => (
          <Card key={card.title} className="dashboard-card">
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                <div className={`p-2 rounded-full ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <LoadingSpinner />
                  <span className="text-muted-foreground">{t('common.loading')}</span>
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

      <Card className="dashboard-card">
        <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
          <CardTitle>{t('revenue.revenueBreakdown')}</CardTitle>
          <CardDescription>
            {t('revenue.detailedEarnings')} {getDateRangeLabel(dateRange).toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className={`flex items-center justify-center py-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <LoadingSpinner />
              <span className={`text-muted-foreground ${isRTL ? 'mr-2' : 'ml-2'}`}>
                {t('revenue.loadingRevenue')}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className={`flex justify-between items-center p-3 bg-blue-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium">{t('revenue.taughtHours')}</span>
                  <span className="font-bold text-blue-600">{revenue.taughtHours}h</span>
                </div>
                <div className={`flex justify-between items-center p-3 bg-green-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium">{t('revenue.ratePerHour')}</span>
                  <span className="font-bold text-green-600">100 {t('revenue.egp')}</span>
                </div>
                <div className={`flex justify-between items-center p-3 bg-gray-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium">{t('revenue.baseEarnings')}</span>
                  <span className="font-bold">{revenue.earnings.toLocaleString()} {t('revenue.egp')}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className={`flex justify-between items-center p-3 bg-purple-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium">{t('revenue.performanceBonus')}</span>
                  <span className="font-bold text-purple-600">{revenue.bonus.toLocaleString()} {t('revenue.egp')}</span>
                </div>
                <div className={`flex justify-between items-center p-3 bg-primary/10 rounded-lg border-2 border-primary/20 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium text-lg">{t('revenue.totalEarnings')}</span>
                  <span className="font-bold text-xl text-primary">{revenue.totalEarnings.toLocaleString()} {t('revenue.egp')}</span>
                </div>
                {revenue.bonus === 0 && (
                  <p className={`text-sm text-muted-foreground text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('revenue.bonusNote')}
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
