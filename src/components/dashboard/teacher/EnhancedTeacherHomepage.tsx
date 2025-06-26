
import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  Calendar,
  ArrowRight,
  User,
  TrendingUp,
  Target,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, toZonedTime } from 'date-fns-tz';
import { toast } from 'sonner';

const EGYPT_TIMEZONE = 'Africa/Cairo';

const EnhancedTeacherHomepage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  
  const { stats, loading: statsLoading, refreshStats } = useTeacherStatistics(dateRange);
  const { sessions, loading: sessionsLoading, refreshSessions } = useTodayPaidSessions();
  const { completeSession, loading: completingSession } = useSessionCompletion();

  useEffect(() => {
    console.log('🏠 HOMEPAGE: Stats updated:', { dateRange, stats, loading: statsLoading });
  }, [stats, statsLoading, dateRange]);

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
      title: 'Active Students',
      value: stats.currentCapacity,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Pending Trials',
      value: stats.pendingTrials,
      icon: Clock,
      gradient: 'from-orange-500 to-amber-600',
      bgGradient: 'from-orange-50 to-amber-50',
      textColor: 'text-orange-700'
    },
    {
      title: 'Confirmed Trials',
      value: stats.confirmedTrials,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Completed Trials',
      value: stats.completedTrials,
      icon: Award,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      textColor: 'text-emerald-700'
    }
  ];

  const quickActions = [
    {
      title: 'Paid Registration',
      description: 'Complete student registration',
      path: '/teacher/paid-registration',
      icon: Users,
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      title: 'Session Management',
      description: 'Manage scheduled sessions',
      path: '/teacher/session-management',
      icon: Calendar,
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Trial Appointments',
      description: 'Manage trial sessions',
      path: '/teacher/trials',
      icon: Clock,
      gradient: 'from-blue-500 to-cyan-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Teaching Dashboard
            </h1>
            <p className="text-muted-foreground">Welcome back! Here's your teaching overview</p>
          </div>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Date Range Info */}
      {dateRange !== 'today' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            📅 Showing data for: <strong>{dateRange.replace('-', ' ').toUpperCase()}</strong>
            {statsLoading && ' (Loading...)'}
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className={`border-0 shadow-lg bg-gradient-to-br ${stat.bgGradient} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>
                    {statsLoading ? (
                      <span className="text-muted-foreground">...</span>
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div className={`p-3 bg-gradient-to-r ${stat.gradient} rounded-xl shadow-lg`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Paid Sessions */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              Today's Paid Sessions
              <Badge variant="outline" className="ml-2 border-green-200 text-green-700">
                {sessions.length} sessions
              </Badge>
            </CardTitle>
            <CardDescription>
              Today's scheduled paid sessions only (trials excluded)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-muted-foreground">Loading sessions...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 bg-gray-100 rounded-xl w-fit mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto" />
                </div>
                <p className="text-gray-600 text-lg font-medium mb-2">No paid sessions today</p>
                <p className="text-sm text-gray-500">
                  Check the Paid Registration tab for students ready to schedule
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <Card key={session.id} className="border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{session.studentName}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>Session {session.sessionNumber}</span>
                              <span>•</span>
                              <span>{formatTime(session.scheduledTime)}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Progress: {session.completedSessions}/{session.totalSessions} sessions
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                          onClick={() => handleCompleteSession(session.id, session.studentName)}
                          disabled={completingSession}
                        >
                          {completingSession ? 'Marking...' : 'Complete'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription>
              Navigate to key sections quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link key={action.path} to={action.path}>
                  <Card className="border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 bg-gradient-to-r ${action.gradient} rounded-lg group-hover:scale-110 transition-transform`}>
                            <action.icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 group-hover:text-gray-700">{action.title}</h4>
                            <p className="text-sm text-gray-600">{action.description}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
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
