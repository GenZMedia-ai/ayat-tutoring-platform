
import React, { useState } from 'react';
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
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, toZonedTime } from 'date-fns-tz';
import { toast } from 'sonner';

const EGYPT_TIMEZONE = 'Africa/Cairo';

const EnhancedTeacherHomepage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const { stats, loading: statsLoading } = useTeacherStatistics(dateRange);
  const { sessions, loading: sessionsLoading, refreshSessions } = useTodayPaidSessions();
  const { completeSession, loading: completingSession } = useSessionCompletion();

  const formatTime = (timeStr: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const utcDateTimeString = `${today}T${timeStr}Z`;
      const utcDateTime = new Date(utcDateTimeString);
      const egyptDateTime = toZonedTime(utcDateTime, EGYPT_TIMEZONE);
      return format(egyptDateTime, 'h:mm a');
    } catch (error) {
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
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Pending Trials',
      value: stats.pendingTrials,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      title: 'Confirmed Trials',
      value: stats.confirmedTrials,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Completed Trials',
      value: stats.completedTrials,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      title: 'Rescheduled',
      value: stats.rescheduledTrials,
      icon: RotateCcw,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50'
    },
    {
      title: 'Ghosted',
      value: stats.ghostedTrials,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50'
    }
  ];

  const quickActions = [
    {
      title: 'Paid Registration',
      description: 'Complete student registration',
      path: '/teacher/paid-registration',
      icon: Users
    },
    {
      title: 'Session Management',
      description: 'Manage scheduled sessions',
      path: '/teacher/session-management',
      icon: Calendar
    },
    {
      title: 'Trial Appointments',
      description: 'Manage trial sessions',
      path: '/teacher/trials',
      icon: Clock
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Overview of your teaching activities</p>
        </div>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="dashboard-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{statsLoading ? '-' : stat.value}</p>
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
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Paid Sessions
            </CardTitle>
            <CardDescription>
              Sessions scheduled for today only
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
                <p className="text-muted-foreground">No paid sessions scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{session.studentName}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Session {session.sessionNumber}</span>
                            <span>•</span>
                            <span>{formatTime(session.scheduledTime)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Progress: {session.completedSessions}/{session.totalSessions} sessions
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="ayat-button-primary"
                        onClick={() => handleCompleteSession(session.id, session.studentName)}
                        disabled={completingSession}
                      >
                        {completingSession ? 'Marking...' : 'Mark Complete'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Navigate to key sections quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link key={action.path} to={action.path}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <action.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{action.title}</h4>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
