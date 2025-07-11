
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionCompletionModal } from '@/components/teacher/SessionCompletionModal';
import { useTeacherScheduledSessions } from '@/hooks/useTeacherScheduledSessions';
import { useWhatsAppContact } from '@/hooks/useWhatsAppContact';
import { EnhancedSessionCard } from '@/components/teacher/EnhancedSessionCard';
import { 
  Clock, 
  Calendar,
  TrendingUp,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const PaidSessionsTab: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const { sessions: todaySessions, loading: todayLoading, refreshSessions: refreshToday } = useTeacherScheduledSessions('today');
  const { sessions: next7DaysSessions, loading: next7Loading, refreshSessions: refreshNext7 } = useTeacherScheduledSessions('next-7-days');
  const { sessions: thisMonthSessions, loading: monthLoading, refreshSessions: refreshMonth } = useTeacherScheduledSessions('this-month');
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { openWhatsApp } = useWhatsAppContact();

  const handleCompleteSession = (session: any) => {
    console.log('📝 Opening session completion modal for:', session.student.name);
    setSelectedSession(session);
  };

  const handleContactStudent = (phone: string, name: string) => {
    console.log('📞 Contacting student:', name, phone);
    openWhatsApp(phone);
  };

  const handleSessionCompletionSuccess = () => {
    console.log('✅ Session completed successfully');
    setSelectedSession(null);
    refreshToday();
    refreshNext7();
    refreshMonth();
  };

  const renderSessionSection = (
    title: string,
    sessions: any[],
    loading: boolean,
    emptyMessage: string,
    icon: React.ElementType,
    iconColor: string,
    gradientFrom: string,
    gradientTo: string
  ) => {
    const SectionIcon = icon;
    const urgentCount = sessions.filter(s => s.priority === 'urgent').length;
    const todayCount = sessions.filter(s => s.priority === 'today').length;

    return (
      <Card className={`border-0 shadow-lg bg-gradient-to-br ${gradientFrom} ${gradientTo} relative overflow-hidden`}>
        {/* Decorative background pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
          <SectionIcon className="w-full h-full" />
        </div>
        
        <CardHeader className="relative">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`p-3 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm`}>
              <SectionIcon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <CardTitle className="text-xl font-bold text-slate-800">
                {title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-white/70 text-slate-700">
                  {sessions.length} {t('sessionManagement.sessionsFound')}
                </Badge>
                {urgentCount > 0 && (
                  <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {urgentCount} urgent
                  </Badge>
                )}
                {todayCount > 0 && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    <Clock className="h-3 w-3 mr-1" />
                    {todayCount} today
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className={`flex items-center justify-center py-12 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className={`text-slate-600 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                {t('sessionManagement.loadingSessions')}
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sessions.map((session) => (
                    <EnhancedSessionCard
                      key={session.id}
                      session={session}
                      onCompleteSession={handleCompleteSession}
                      onContactStudent={handleContactStudent}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl w-fit mx-auto mb-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                  </div>
                  <p className="text-slate-700 text-lg font-medium mb-2">
                    {emptyMessage}
                  </p>
                  <p className="text-sm text-slate-600">
                    All sessions in this period are completed or not scheduled yet
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-800">{todaySessions.length}</p>
                <p className="text-sm text-blue-600">Today's Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-800">{next7DaysSessions.length}</p>
                <p className="text-sm text-green-600">Next 7 Days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-800">{thisMonthSessions.length}</p>
                <p className="text-sm text-purple-600">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session sections */}
      {renderSessionSection(
        t('sessionManagement.todaySessions'),
        todaySessions,
        todayLoading,
        t('sessionManagement.noSessionsToday'),
        Clock,
        'text-blue-600',
        'from-blue-50',
        'to-indigo-50'
      )}
      
      {renderSessionSection(
        t('sessionManagement.next7DaysSessions'),
        next7DaysSessions,
        next7Loading,
        t('sessionManagement.noSessionsNext7Days'),
        Calendar,
        'text-green-600',
        'from-green-50',
        'to-emerald-50'
      )}
      
      {renderSessionSection(
        t('sessionManagement.thisMonthSessions'),
        thisMonthSessions,
        monthLoading,
        t('sessionManagement.noSessionsThisMonth'),
        Sparkles,
        'text-purple-600',
        'from-purple-50',
        'to-violet-50'
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
