
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
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    },
    {
      title: t('revenue.earnings'),
      value: loading ? '-' : `${revenue.earnings.toLocaleString()} ${t('revenue.egp')}`,
      description: `${revenue.taughtHours}h × 100 ${t('revenue.egp')}`,
      icon: DollarSign,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    },
    {
      title: t('revenue.bonus'),
      value: loading ? '-' : `${revenue.bonus.toLocaleString()} ${t('revenue.egp')}`,
      description: t('revenue.adminAddedBonus'),
      icon: Gift,
      color: 'text-purple-700',
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    },
    {
      title: t('revenue.totalEarnings'),
      value: loading ? '-' : `${revenue.totalEarnings.toLocaleString()} ${t('revenue.egp')}`,
      description: t('revenue.earningsBonus'),
      icon: TrendingUp,
      color: 'text-stone-700',
      bg: 'bg-stone-50',
      border: 'border-stone-200'
    }
  ];

  const getDateRangeLabel = (range: DateRange) => {
    return t(`revenue.${range.replace('-', '')}`);
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h1 className="text-3xl font-bold text-stone-800">{t('revenue.title')}</h1>
          <p className="text-stone-600 mt-1">
            {t('revenue.subtitle')} {getDateRangeLabel(dateRange).toLowerCase()}
          </p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueCards.map((card) => (
          <Card key={card.title} className="border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm font-medium text-stone-600">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.bg} ${card.border} border`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <LoadingSpinner />
                  <span className="text-stone-500">{t('common.loading')}</span>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-stone-800">{card.value}</p>
                  <p className="text-sm text-stone-500 mt-1">{card.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-stone-200 shadow-sm bg-white">
        <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
          <CardTitle className="text-stone-800">{t('revenue.revenueBreakdown')}</CardTitle>
          <CardDescription className="text-stone-600">
            {t('revenue.detailedEarnings')} {getDateRangeLabel(dateRange).toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className={`flex items-center justify-center py-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <LoadingSpinner />
              <span className={`text-stone-500 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                {t('revenue.loadingRevenue')}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className={`flex justify-between items-center p-4 bg-amber-50 rounded-lg border border-amber-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium text-stone-800">{t('revenue.taughtHours')}</span>
                  <span className="font-bold text-amber-700">{revenue.taughtHours}h</span>
                </div>
                <div className={`flex justify-between items-center p-4 bg-emerald-50 rounded-lg border border-emerald-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium text-stone-800">{t('revenue.ratePerHour')}</span>
                  <span className="font-bold text-emerald-700">100 {t('revenue.egp')}</span>
                </div>
                <div className={`flex justify-between items-center p-4 bg-stone-50 rounded-lg border border-stone-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium text-stone-800">{t('revenue.baseEarnings')}</span>
                  <span className="font-bold text-stone-800">{revenue.earnings.toLocaleString()} {t('revenue.egp')}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className={`flex justify-between items-center p-4 bg-purple-50 rounded-lg border border-purple-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium text-stone-800">{t('revenue.performanceBonus')}</span>
                  <span className="font-bold text-purple-700">{revenue.bonus.toLocaleString()} {t('revenue.egp')}</span>
                </div>
                <div className={`flex justify-between items-center p-4 bg-gradient-to-r from-stone-50 to-stone-100 rounded-lg border-2 border-stone-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium text-lg text-stone-800">{t('revenue.totalEarnings')}</span>
                  <span className="font-bold text-xl text-stone-800">{revenue.totalEarnings.toLocaleString()} {t('revenue.egp')}</span>
                </div>
                {revenue.bonus === 0 && (
                  <p className={`text-sm text-stone-500 text-center ${isRTL ? 'text-right' : 'text-left'}`}>
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
