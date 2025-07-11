
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaidSessionsTab } from './PaidSessionsTab';
import { ActiveStudentProgressTab } from './ActiveStudentProgressTab';
import { Calendar, TrendingUp, Sparkles } from 'lucide-react';

const SessionManagementTabs: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`}>
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-3xl font-bold mb-2">{t('sessionManagement.title')}</h1>
            <p className="text-blue-100 text-lg">
              {t('sessionManagement.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="paid-sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl h-auto">
          <TabsTrigger 
            value="paid-sessions" 
            className={`flex items-center gap-3 px-6 py-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Calendar className="h-5 w-5" />
            <span className="font-medium">{t('sessionManagement.paidSessions')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="active-progress" 
            className={`flex items-center gap-3 px-6 py-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="font-medium">{t('sessionManagement.activeStudentProgress')}</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="paid-sessions" className="mt-8">
          <PaidSessionsTab />
        </TabsContent>
        
        <TabsContent value="active-progress" className="mt-8">
          <ActiveStudentProgressTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SessionManagementTabs;
