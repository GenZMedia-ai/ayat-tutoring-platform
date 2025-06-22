
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SessionCompletionModal } from '@/components/teacher/SessionCompletionModal';
import { SessionProgressTracker } from '@/components/teacher/SessionProgressTracker';
import { Clock, Play, CheckCircle, Calendar, User } from 'lucide-react';

const TeacherSessionManagement: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<any>(null);

  // Mock data for demonstration - in real implementation, this would come from a hook
  const todayPaidSessions = [
    {
      id: '1',
      studentId: 'student-1',
      studentName: 'Omar Ali',
      sessionNumber: 3,
      totalSessions: 8,
      scheduledTime: '16:00',
      actualMinutes: null,
      status: 'scheduled',
      platform: 'zoom',
      notes: 'Continuing with advanced Tajweed rules'
    },
    {
      id: '2', 
      studentId: 'student-2',
      studentName: 'Layla Hassan',
      sessionNumber: 5,
      totalSessions: 16,
      scheduledTime: '18:30',
      actualMinutes: null,
      status: 'scheduled',
      platform: 'google-meet',
      notes: 'Working on memorization techniques'
    }
  ];

  const activeStudents = [
    { id: 'student-1', name: 'Omar Ali' },
    { id: 'student-2', name: 'Layla Hassan' },
    { id: 'student-3', name: 'Youssef Ahmed' }
  ];

  const handleCompleteSession = (session: any) => {
    console.log('📝 Opening session completion modal for:', session.studentName);
    setSelectedSession(session);
  };

  const handleSessionCompletionSuccess = () => {
    console.log('✅ Session completed successfully');
    setSelectedSession(null);
    // In real implementation, refresh sessions data
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
                          <span className="capitalize">{session.platform}</span>
                        </div>
                      </div>
                      
                      {session.notes && (
                        <p className="text-sm text-muted-foreground">{session.notes}</p>
                      )}
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
              
              {todayPaidSessions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-lg font-medium">No sessions scheduled for today</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your next sessions will appear here
                  </p>
                </div>
              )}
            </div>
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
            <div className="space-y-4">
              {activeStudents.map((student) => (
                <SessionProgressTracker
                  key={student.id}
                  studentId={student.id}
                  studentName={student.name}
                />
              ))}
              
              {activeStudents.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-lg font-medium">No active students</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Students will appear here after registration completion
                  </p>
                </div>
              )}
            </div>
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
