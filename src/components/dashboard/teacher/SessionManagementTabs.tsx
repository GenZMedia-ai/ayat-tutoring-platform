
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaidSessionsTab } from './PaidSessionsTab';
import { ActiveStudentProgressTab } from './ActiveStudentProgressTab';
import { Clock, TrendingUp } from 'lucide-react';

const SessionManagementTabs: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Clock className="h-6 w-6 text-blue-600" />
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h2 className="text-2xl font-bold">{t('sessionManagement.title')}</h2>
          <p className="text-muted-foreground">
            {t('sessionManagement.subtitle')}
          </p>
        </div>
      </div>

      <Tabs defaultValue="paid-sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paid-sessions" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Clock className="h-4 w-4" />
            {t('sessionManagement.paidSessions')}
          </TabsTrigger>
          <TabsTrigger value="active-progress" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <TrendingUp className="h-4 w-4" />
            {t('sessionManagement.activeStudentProgress')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="paid-sessions" className="mt-6">
          <PaidSessionsTab />
        </TabsContent>
        
        <TabsContent value="active-progress" className="mt-6">
          <ActiveStudentProgressTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SessionManagementTabs;
