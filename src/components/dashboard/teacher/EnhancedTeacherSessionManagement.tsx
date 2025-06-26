
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SessionCompletionModal } from '@/components/teacher/SessionCompletionModal';
import { SessionProgressTracker } from '@/components/teacher/SessionProgressTracker';
import { useTodayPaidSessions } from '@/hooks/useTodayPaidSessions';
import { useTeacherActiveStudents } from '@/hooks/useTeacherActiveStudents';
import { SmartDateFilter, DateRange } from '@/components/teacher/SmartDateFilter';
import { 
  Clock, 
  Play, 
  CheckCircle, 
  Calendar, 
  User, 
  TrendingUp,
  Target,
  Award,
  Zap
} from 'lucide-react';

const EnhancedTeacherSessionManagement: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState<DateRange>('this-week');
  const { sessions: todayPaidSessions, loading: sessionsLoading, refreshSessions } = useTodayPaidSessions();
  const { students: activeStudents, loading: studentsLoading, refreshStudents } = useTeacherActiveStudents();

  const handleCompleteSession = (session: any) => {
    console.log('📝 Opening session completion modal for:', session.studentName);
    setSelectedSession(session);
  };

  const handleSessionCompletionSuccess = () => {
    console.log('✅ Session completed successfully');
    setSelectedSession(null);
    refreshSessions();
    refreshStudents();
  };

  const getSessionProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">Session Management</h2>
            <p className="text-muted-foreground">
              Manage your teaching sessions and track student progress
            </p>
          </div>
        </div>
        <SmartDateFilter 
          value={dateFilter} 
          onChange={setDateFilter}
          resultCount={todayPaidSessions.length + activeStudents.length}
        />
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dashboard-card border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Sessions</p>
                <p className="text-2xl font-bold text-blue-600">{todayPaidSessions.length}</p>
              </div>
              <Play className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold text-green-600">{activeStudents.length}</p>
              </div>
              <User className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {activeStudents.length > 0 
                    ? Math.round((activeStudents.reduce((sum, s) => sum + s.completedSessions, 0) / 
                        activeStudents.reduce((sum, s) => sum + s.totalSessions, 0)) * 100) 
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessions Left</p>
                <p className="text-2xl font-bold text-orange-600">
                  {activeStudents.reduce((sum, s) => sum + (s.totalSessions - s.completedSessions), 0)}
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Today's Paid Sessions */}
        <Card className="dashboard-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                Today's Sessions
              </CardTitle>
              <Badge variant="outline" className="bg-blue-50 border-blue-200">
                {todayPaidSessions.length} scheduled
              </Badge>
            </div>
            <CardDescription>
              Sessions scheduled for today - mark as completed after teaching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                  <span className="text-muted-foreground">Loading sessions...</span>
                </div>
              </div>
            ) : todayPaidSessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-muted-foreground text-lg font-medium">No sessions scheduled for today</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your next sessions will appear here
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {todayPaidSessions.map((session) => (
                  <div key={session.id} className="group p-4 border border-border rounded-lg bg-gradient-to-r from-blue-50 to-white hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{session.studentName}</h4>
                            <Badge variant="secondary" className="text-xs">
                              Session {session.sessionNumber}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{session.scheduledTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>{session.completedSessions}/{session.totalSessions} completed</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Progress 
                              value={getSessionProgressPercentage(session.completedSessions, session.totalSessions)} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        className="ayat-button-primary flex items-center gap-2 group-hover:scale-105 transition-transform"
                        onClick={() => handleCompleteSession(session)}
                      >
                        <Zap className="h-4 w-4" />
                        Complete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Progress Overview */}
        <Card className="dashboard-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <Award className="h-4 w-4 text-green-600" />
                </div>
                Student Progress
              </CardTitle>
              <Badge variant="outline" className="bg-green-50 border-green-200">
                {activeStudents.length} active
              </Badge>
            </div>
            <CardDescription>
              Track completion progress for all your active students
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {studentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                  <span className="text-muted-foreground">Loading students...</span>
                </div>
              </div>
            ) : activeStudents.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-muted-foreground text-lg font-medium">No active students</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Students will appear here after registration completion
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activeStudents.map((student) => (
                  <SessionProgressTracker
                    key={student.studentId}
                    studentId={student.studentId}
                    studentName={student.studentName}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SessionCompletionModal
        session={selectedSession}
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        onSuccess={handleSessionCompletionSuccess}
      />
    </div>
  );
};

export default EnhancedTeacherSessionManagement;
