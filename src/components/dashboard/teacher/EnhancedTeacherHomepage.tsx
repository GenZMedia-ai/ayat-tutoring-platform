
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SmartDateFilter, DateRange } from '@/components/teacher/SmartDateFilter';
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
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, toZonedTime } from 'date-fns-tz';
import { toast } from 'sonner';

const EGYPT_TIMEZONE = 'Africa/Cairo';

const EnhancedTeacherHomepage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('this-week');
  
  const { stats, loading: statsLoading, refreshStats } = useTeacherStatistics(dateRange);
  const { sessions, loading: sessionsLoading, refreshSessions } = useTodayPaidSessions();
  const { completeSession, loading: completingSession } = useSessionCompletion();

  useEffect(() => {
    console.log('🏠 HOMEPAGE: Stats updated:', { dateRange, stats, loading: statsLoading });
  }, [stats, statsLoading, dateRange]);

  useEffect(() => {
    console.log('🏠 HOMEPAGE: Sessions updated:', { sessions, loading: sessionsLoading });
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
      title: 'Current Capacity',
      value: stats.currentCapacity,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Pending Trials',
      value: stats.pendingTrials,
      icon: Clock,
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Confirmed Trials',
      value: stats.confirmedTrials,
      icon: CheckCircle,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200'
    },
    {
      title: 'Completed Trials',
      value: stats.completedTrials,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200'
    },
    {
      title: 'Rescheduled',
      value: stats.rescheduledTrials,
      icon: RotateCcw,
      gradient: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Ghosted',
      value: stats.ghostedTrials,
      icon: XCircle,
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200'
    }
  ];

  const quickActions = [
    {
      title: 'Paid Registration',
      description: 'Complete student registration',
      path: '/teacher/paid-registration',
      icon: Users,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Session Management',
      description: 'Manage scheduled sessions',
      path: '/teacher/session-management',
      icon: Calendar,
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Trial Appointments',
      description: 'Manage trial sessions',
      path: '/teacher/trials',
      icon: Clock,
      gradient: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Teacher Dashboard
            </h1>
            <p className="text-muted-foreground">Overview of your teaching activities</p>
          </div>
        </div>
        <SmartDateFilter 
          value={dateRange} 
          onChange={setDateRange}
          resultCount={Object.values(stats).reduce((a, b) => a + b, 0)}
        />
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className={`dashboard-card border-2 ${stat.borderColor} ${stat.bgColor} hover:shadow-lg transition-all duration-300 hover:scale-105`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.gradient} shadow-md`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
                {stat.value > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>
                  {statsLoading ? (
                    <span className="text-muted-foreground">...</span>
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Today's Paid Sessions */}
        <Card className="dashboard-card bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                Today's Sessions
              </CardTitle>
              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                {sessions.length} scheduled
              </Badge>
            </div>
            <CardDescription>
              Only paid sessions scheduled for today (trials excluded)
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
                <div className="p-4 bg-white rounded-lg border border-blue-200">
                  <Calendar className="h-12 w-12 text-blue-300 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No paid sessions today</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check Paid Registration for students ready to schedule
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="group p-4 bg-white border border-blue-200 rounded-lg hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900">{session.studentName}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Session {session.sessionNumber}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(session.scheduledTime)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Progress: {session.completedSessions}/{session.totalSessions} sessions
                          </div>
                        </div>
                      </div>
                      <Button
                        className="ayat-button-primary flex items-center gap-2 group-hover:scale-105 transition-transform"
                        onClick={() => handleCompleteSession(session.id, session.studentName)}
                        disabled={completingSession}
                      >
                        <CheckCircle className="h-4 w-4" />
                        {completingSession ? 'Marking...' : 'Complete'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Quick Actions */}
        <Card className="dashboard-card bg-gradient-to-br from-white to-primary/5 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-primary to-secondary rounded-lg shadow-md">
                <TrendingUp className="h-5 w-5 text-white" />
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
                  <Card className="hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer bg-white border-2 border-gray-200 hover:border-primary/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 bg-gradient-to-r ${action.gradient} rounded-lg shadow-md`}>
                            <action.icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{action.title}</h4>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
