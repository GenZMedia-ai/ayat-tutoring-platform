
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DateFilter, DateRange } from '@/components/teacher/DateFilter';
import { useTeacherStatistics } from '@/hooks/useTeacherStatistics';
import { useTodayPaidSessions } from '@/hooks/useTodayPaidSessions';
import { useSessionCompletion } from '@/hooks/useSessionCompletion';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Calendar,
  ArrowRight,
  User,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, toZonedTime } from 'date-fns-tz';
import { toast } from 'sonner';

const EGYPT_TIMEZONE = 'Africa/Cairo';

const EnhancedTeacherHomepage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  
  const { stats, loading: statsLoading, refreshStats } = useTeacherStatistics(dateRange);
  const { sessions, loading: sessionsLoading, refreshSessions } = useTodayPaidSessions();
  const { completeSession, loading: completingSession } = useSessionCompletion();

  useEffect(() => {
    console.log('🏠 FIXED: Homepage stats updated:', { dateRange, stats, loading: statsLoading });
  }, [stats, statsLoading, dateRange]);

  useEffect(() => {
    console.log('🏠 FIXED: Homepage sessions updated:', { sessions, loading: sessionsLoading });
  }, [sessions, sessionsLoading]);

  const formatTime = (timeStr: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const utcDateTimeString = `${today}T${timeStr}Z`;
      const utcDateTime = new Date(utcDateTimeString);
      const egyptDateTime = toZonedTime(utcDateTime, EGYPT_TIMEZONE);
      return format(egyptDateTime, 'h:mm a');
    } catch (error) {
      console.error('❌ Error formatting time:', error);
      return timeStr;
    }
  };

  const handleCompleteSession = async (sessionId: string, studentName: string) => {
    const result = await completeSession(sessionId, 60, `Session completed for ${studentName}`, true);
    if (result) {
      toast.success('Session marked as completed');
      refreshSessions();
    }
  };

  const statCards = [
    {
      title: t('homepage.currentCapacity'),
      value: stats.currentCapacity,
      icon: Users,
      color: 'text-stone-600',
      bg: 'bg-stone-50'
    },
    {
      title: t('homepage.pendingTrials'),
      value: stats.pendingTrials,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      title: t('homepage.confirmedTrials'),
      value: stats.confirmedTrials,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: t('homepage.completedTrials'),
      value: stats.completedTrials,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      title: t('homepage.rescheduled'),
      value: stats.rescheduledTrials,
      icon: RotateCcw,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50'
    },
    {
      title: t('homepage.ghosted'),
      value: stats.ghostedTrials,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      title: 'Paid Students',
      value: stats.paidStudents,
      icon: Users,
      color: 'text-stone-700',
      bg: 'bg-stone-100'
    },
    {
      title: 'Active Registrations',
      value: stats.completedRegistrations,
      icon: CheckCircle,
      color: 'text-stone-600',
      bg: 'bg-stone-50'
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-stone-700',
      bg: 'bg-stone-100'
    },
    {
      title: 'Completed Subscriptions',
      value: stats.expiredStudents,
      icon: CheckCircle,
      color: 'text-stone-500',
      bg: 'bg-stone-50'
    }
  ];

  const quickActions = [
    {
      title: t('sidebar.paidRegistration'),
      description: t('homepage.completeRegistration'),
      path: '/teacher/paid-registration',
      icon: Users
    },
    {
      title: t('sidebar.sessionManagement'),
      description: t('homepage.manageSessions'),
      path: '/teacher/session-management',
      icon: Calendar
    },
    {
      title: t('sidebar.trialAppointments'),
      description: t('homepage.manageTrials'),
      path: '/teacher/trials',
      icon: Clock
    }
  ];

  // FIXED: Add debugging info when no data is available
  const hasAnyData = stats.totalStudents > 0;
  const debugInfo = {
    statsLoading,
    sessionsLoading,
    totalStudents: stats.totalStudents,
    sessionsCount: sessions.length,
    dateRange,
    hasAnyData
  };

  console.log('🏠 FIXED: Homepage render debug info:', debugInfo);

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h1 className="text-2xl font-bold text-stone-800">{t('homepage.title')}</h1>
          <p className="text-stone-600">{t('homepage.subtitle')}</p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* FIXED: Show debug info and data status */}
      {dateRange !== 'today' && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
          <p className={`text-sm text-stone-700 ${isRTL ? 'text-right' : 'text-left'}`}>
            📅 Showing data for: <strong>{dateRange.replace('-', ' ').toUpperCase()}</strong>
            {statsLoading && ' (Loading...)'}
            {!hasAnyData && !statsLoading && (
              <span className="text-orange-600 ml-2">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                No data found for this period
              </span>
            )}
          </p>
        </div>
      )}

      {/* FIXED: Show helpful message when no data is available */}
      {!hasAnyData && !statsLoading && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-medium text-orange-900">No Data Available</h3>
                <p className="text-sm text-orange-700 mt-1">
                  {dateRange === 'today' 
                    ? "You don't have any students or sessions for today. Try selecting a different date range or check if you have any assigned students."
                    : `No data found for ${dateRange.replace('-', ' ')}. Try selecting a different date range or "All Time" to see your data.`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-stone-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-medium text-stone-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-stone-800">
                    {statsLoading ? (
                      <span className="text-stone-400">...</span>
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Paid Sessions */}
        <Card className="border-stone-200">
          <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
            <CardTitle className={`flex items-center gap-2 text-stone-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="h-5 w-5" />
              {t('homepage.todaysSessions')}
            </CardTitle>
            <CardDescription className="text-stone-600">
              {t('homepage.sessionsScheduled')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className={`ml-2 text-stone-600 ${isRTL ? 'mr-2 ml-0' : ''}`}>
                  {t('common.loading')}...
                </span>
              </div>
            ) : sessions.length === 0 ? (
              <div className={`text-center py-8 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="text-stone-600">{t('homepage.noSessions')}</p>
                <p className="text-sm text-stone-500 mt-1">
                  {t('homepage.checkRegistration')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="p-3 border border-stone-200 rounded-lg bg-stone-50">
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="p-2 bg-stone-100 rounded-full">
                          <User className="h-4 w-4 text-stone-600" />
                        </div>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                          <h4 className="font-medium text-stone-800">{session.studentName}</h4>
                          <div className={`flex items-center gap-2 text-sm text-stone-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span>Session {session.sessionNumber}</span>
                            <span>•</span>
                            <span>{formatTime(session.scheduledTime)}</span>
                          </div>
                          <div className="text-xs text-stone-500">
                            Progress: {session.completedSessions}/{session.totalSessions} sessions
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-stone-600 hover:bg-stone-700 text-white"
                        onClick={() => handleCompleteSession(session.id, session.studentName)}
                        disabled={completingSession}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {completingSession ? 'Marking...' : t('homepage.markComplete')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-stone-200">
          <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
            <CardTitle className="text-stone-800">{t('homepage.quickActions')}</CardTitle>
            <CardDescription className="text-stone-600">
              {t('homepage.navigateQuickly')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link key={action.path} to={action.path}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-stone-200 hover:border-stone-300">
                    <CardContent className="p-4">
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="p-2 bg-stone-100 rounded-full">
                            <action.icon className="h-4 w-4 text-stone-600" />
                          </div>
                          <div className={isRTL ? 'text-right' : 'text-left'}>
                            <h4 className="font-medium text-stone-800">{action.title}</h4>
                            <p className="text-sm text-stone-600">{action.description}</p>
                          </div>
                        </div>
                        <ArrowRight className={`h-4 w-4 text-stone-500 ${isRTL ? 'rotate-180' : ''}`} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedTeacherHomepage;
