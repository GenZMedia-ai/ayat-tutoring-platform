
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SessionCompletionModal } from '@/components/teacher/SessionCompletionModal';
import { useTodayPaidSessions } from '@/hooks/useTodayPaidSessions';
import { useSessionsByDateRange } from '@/hooks/useSessionsByDateRange';
import { Clock, Play, CheckCircle, Calendar, User } from 'lucide-react';

export const PaidSessionsTab: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const { sessions: todaySessions, loading: todayLoading, refreshSessions: refreshToday } = useTodayPaidSessions();
  const { sessions: next7DaysSessions, loading: next7Loading, refreshSessions: refreshNext7 } = useSessionsByDateRange('next-7-days');
  const { sessions: thisMonthSessions, loading: monthLoading, refreshSessions: refreshMonth } = useSessionsByDateRange('this-month');
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const handleCompleteSession = (session: any) => {
    console.log('📝 Opening session completion modal for:', session.studentName);
    setSelectedSession(session);
  };

  const handleSessionCompletionSuccess = () => {
    console.log('✅ Session completed successfully');
    setSelectedSession(null);
    refreshToday();
    refreshNext7();
    refreshMonth();
  };

  const renderSessionCard = (session: any) => (
    <div key={session.id} className="p-4 border border-border rounded-lg bg-blue-50 dark:bg-blue-900/20">
      <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="space-y-2 flex-1">
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <User className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">{session.studentName}</h4>
            <Badge variant="outline">
              {t('sessionManagement.sessionNumber')} {session.sessionNumber}/{session.totalSessions}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>{session.scheduledTime}</span>
            </div>
            <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>{t('sessionManagement.progress')}: {session.completedSessions}/{session.totalSessions}</span>
            </div>
          </div>
        </div>
        
        <Button 
          size="sm"
          className={`ayat-button-primary flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}
          onClick={() => handleCompleteSession(session)}
        >
          <CheckCircle className="h-3 w-3" />
          {t('sessionManagement.completeSession')}
        </Button>
      </div>
    </div>
  );

  const renderSessionSection = (
    title: string, 
    sessions: any[], 
    loading: boolean, 
    emptyMessage: string
  ) => (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Play className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
        <CardDescription className={isRTL ? 'text-right' : 'text-left'}>
          {sessions.length} {t('sessionManagement.sessionsFound')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className={`flex items-center justify-center py-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className={`text-muted-foreground ${isRTL ? 'mr-2' : 'ml-2'}`}>
              {t('sessionManagement.loadingSessions')}
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(renderSessionCard)}
            
            {sessions.length === 0 && !loading && (
              <div className={`text-center py-8 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="text-muted-foreground text-lg font-medium">{emptyMessage}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {renderSessionSection(
        t('sessionManagement.todaySessions'),
        todaySessions,
        todayLoading,
        t('sessionManagement.noSessionsToday')
      )}
      
      {renderSessionSection(
        t('sessionManagement.next7DaysSessions'),
        next7DaysSessions,
        next7Loading,
        t('sessionManagement.noSessionsNext7Days')
      )}
      
      {renderSessionSection(
        t('sessionManagement.thisMonthSessions'),
        thisMonthSessions,
        monthLoading,
        t('sessionManagement.noSessionsThisMonth')
      )}

      <SessionCompletionModal
        session={selectedSession}
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        onSuccess={handleSessionCompletionSuccess}
      />
    </div>
  );
};
