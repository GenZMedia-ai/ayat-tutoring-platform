
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SessionCompletionModal } from '@/components/teacher/SessionCompletionModal';
import { SessionProgressTracker } from '@/components/teacher/SessionProgressTracker';
import { useTodayPaidSessions } from '@/hooks/useTodayPaidSessions';
import { useTeacherActiveStudents } from '@/hooks/useTeacherActiveStudents';
import { Clock, Play, CheckCircle, Calendar, User } from 'lucide-react';

const TeacherSessionManagement: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<any>(null);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold">Session Management</h2>
          <p className="text-muted-foreground">
            Manage ongoing paid sessions and track student progress
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Paid Sessions */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              Today's Paid Sessions
            </CardTitle>
            <CardDescription>
              Sessions scheduled for today - mark as completed after teaching
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-muted-foreground">Loading sessions...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {todayPaidSessions.map((session) => (
                  <div key={session.id} className="p-4 border border-border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-medium">{session.studentName}</h4>
                          <Badge variant="outline">
                            Session {session.sessionNumber}/{session.totalSessions}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{session.scheduledTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>Progress: {session.completedSessions}/{session.totalSessions}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm"
                        className="ayat-button-primary flex items-center gap-1"
                        onClick={() => handleCompleteSession(session)}
                      >
                        <CheckCircle className="h-3 w-3" />
                        Complete Session
                      </Button>
                    </div>
                  </div>
                ))}
                
                {todayPaidSessions.length === 0 && !sessionsLoading && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-lg font-medium">No sessions scheduled for today</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your next sessions will appear here
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Progress Overview */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Active Student Progress
            </CardTitle>
            <CardDescription>
              Track progress for all your active students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-muted-foreground">Loading students...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {activeStudents.map((student) => (
                  <SessionProgressTracker
                    key={student.studentId}
                    studentId={student.studentId}
                    studentName={student.studentName}
                  />
                ))}
                
                {activeStudents.length === 0 && !studentsLoading && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-lg font-medium">No active students</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Students will appear here after registration completion
                    </p>
                  </div>
                )}
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

export default TeacherSessionManagement;
