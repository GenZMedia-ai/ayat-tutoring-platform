
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import EnhancedTeacherTrials from '@/components/teacher/EnhancedTeacherTrials';

const EnhancedTeacherTrialsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <EnhancedTeacherTrials />
    </div>
  );
};

export default EnhancedTeacherTrialsPage;
