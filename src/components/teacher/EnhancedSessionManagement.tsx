
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EnhancedSessionCard } from './EnhancedSessionCard';
import { SessionCompletionModal } from './SessionCompletionModal';
import { useTeacherSessionsEnhanced, EnhancedSessionData } from '@/hooks/useTeacherSessionsEnhanced';
import { useWhatsAppContact } from '@/hooks/useWhatsAppContact';
import { 
  Clock, 
  Calendar, 
  CalendarDays, 
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const EnhancedSessionManagement: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<EnhancedSessionData | null>(null);
  const { sessions, loading, refreshSessions } = useTeacherSessionsEnhanced();
  const { openWhatsApp } = useWhatsAppContact();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const handleCompleteSession = (session: EnhancedSessionData) => {
    console.log('📝 Opening session completion modal for:', session.studentName);
    setSelectedSession(session);
  };

  const handleSessionCompletionSuccess = () => {
    console.log('✅ Session completed successfully');
    setSelectedSession(null);
    refreshSessions();
  };

  const handleContactParent = (phone: string, name: string) => {
    console.log('📞 Contacting parent:', name, phone);
    openWhatsApp(phone);
  };

  const getTotalStats = () => {
    const allSessions = [...sessions.today, ...sessions.next7Days, ...sessions.thisMonth];
    const totalSessions = allSessions.length;
    const todayCount = sessions.today.length;
    const upcomingCount = sessions.next7Days.length;
    const completedToday = allSessions.filter(s => s.status === 'completed' && s.priority === 'today').length;

    return { totalSessions, todayCount, upcomingCount, completedToday };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`}>
      {/* Header Section */}
      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="p-3 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Session Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your scheduled teaching sessions with enhanced family support
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Today's Sessions</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.todayCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">This Week</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.upcomingCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Completed Today</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.completedToday}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Total Sessions</p>
                <p className="text-2xl font-bold text-primary">{stats.totalSessions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Tabs */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Today
            {stats.todayCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.todayCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="week" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Next 7 Days
            {stats.upcomingCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.upcomingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="month" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            This Month
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {sessions.today.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Sessions Today
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You don't have any scheduled sessions for today. Enjoy your day!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sessions.today.map((session) => (
                <EnhancedSessionCard
                  key={session.id}
                  session={session}
                  onCompleteSession={handleCompleteSession}
                  onContactParent={handleContactParent}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          {sessions.next7Days.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Upcoming Sessions
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No sessions scheduled for the next 7 days.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sessions.next7Days.map((session) => (
                <EnhancedSessionCard
                  key={session.id}
                  session={session}
                  onCompleteSession={handleCompleteSession}
                  onContactParent={handleContactParent}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          {sessions.thisMonth.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Monthly Sessions
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No sessions scheduled for this month.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sessions.thisMonth.map((session) => (
                <EnhancedSessionCard
                  key={session.id}
                  session={session}
                  onCompleteSession={handleCompleteSession}
                  onContactParent={handleContactParent}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Session Completion Modal */}
      {selectedSession && (
        <SessionCompletionModal
          session={{
            id: selectedSession.id,
            studentName: selectedSession.studentName,
            sessionNumber: selectedSession.sessionNumber,
            totalSessions: selectedSession.totalSessions,
            scheduledTime: selectedSession.displayTime,
            completedSessions: selectedSession.completedSessions
          }}
          open={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          onSuccess={handleSessionCompletionSuccess}
        />
      )}
    </div>
  );
};
