
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { DateFilter, DateRange } from '@/components/teacher/DateFilter';
import { EnhancedTeacherTrials as TrialsContent } from '@/components/teacher/EnhancedTeacherTrials';

const EnhancedTeacherTrials: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h1 className="text-2xl font-bold text-primary">{t('trials.title')}</h1>
          <p className="text-muted-foreground">{t('trials.subtitle')}</p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      <TrialsContent dateRange={dateRange} />
    </div>
  );
};

export default EnhancedTeacherTrials;
