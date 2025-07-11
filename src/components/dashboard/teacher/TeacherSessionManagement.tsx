
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import SessionManagementTabs from './SessionManagementTabs';

const TeacherSessionManagement: React.FC = () => {
  const { isRTL } = useLanguage();

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <SessionManagementTabs />
    </div>
  );
};

export default TeacherSessionManagement;
