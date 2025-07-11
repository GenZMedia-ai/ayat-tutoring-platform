
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import PaidStudentsSection from '@/components/teacher/PaidStudentsSection';

const EnhancedTeacherPaidRegistration: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h1 className="text-2xl font-bold text-primary">{t('paidRegistration.title')}</h1>
          <p className="text-muted-foreground">{t('paidRegistration.subtitle')}</p>
        </div>
      </div>

      <PaidStudentsSection />
    </div>
  );
};

export default EnhancedTeacherPaidRegistration;
