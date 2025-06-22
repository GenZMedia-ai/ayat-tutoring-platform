
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeacherTrialSessions } from '@/hooks/useTeacherTrialSessions';
import { useTeacherPaidStudents } from '@/hooks/useTeacherPaidStudents';
import { useWhatsAppContact } from '@/hooks/useWhatsAppContact';
import PaidStudentsSection from '@/components/teacher/PaidStudentsSection';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { DollarSign, Users, Clock, CheckCircle } from 'lucide-react';

const TeacherHomepage: React.FC = () => {
  const { trialStudents, loading: trialsLoading } = useTeacherTrialSessions();
  const { paidStudents, loading: paidLoading } = useTeacherPaidStudents();

  // Calculate stats from trial students data
  const teacherStats = {
    capacity: 8,
    maxCapacity: 10,
    pendingTrials: trialStudents.filter(s => s.status === 'pending').length,
    confirmedTrials: trialStudents.filter(s => s.status === 'confirmed').length,
    completedTrials: trialStudents.filter(s => s.status === 'trial-completed').length,
    paidStudentsCount: paidStudents.length,
    todaySessions: 3,
    monthlyEarnings: 1250
  };

  // Mock data for today's sessions
  const todaySessions = [
    { id: '1', studentName: 'Omar Ali', time: '16:00', sessionNumber: 3, totalSessions: 8, type: 'paid' },
    { id: '2', studentName: 'Layla Hassan', time: '18:30', sessionNumber: 5, totalSessions: 16, type: 'paid' },
    { id: '3', studentName: 'Youssef Ahmed', time: '20:00', sessionNumber: 1, totalSessions: 8, type: 'paid' }
  ];

  const handleCompleteSession = (sessionId: string) => {
    console.log('Session completed:', sessionId);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{teacherStats.capacity}/{teacherStats.maxCapacity}</div>
            <p className="text-xs text-muted-foreground">Active students</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Trials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{teacherStats.pendingTrials}</div>
            <p className="text-xs text-muted-foreground">Require contact</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Trials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{teacherStats.confirmedTrials}</div>
            <p className="text-xs text-muted-foreground">Ready for trial</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Paid Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{teacherStats.paidStudentsCount}</div>
            <p className="text-xs text-muted-foreground">Need registration</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Trials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{teacherStats.completedTrials}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Paid Students Section - Only show if there are paid students */}
      {!paidLoading && paidStudents.length > 0 && (
        <PaidStudentsSection />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Paid Sessions */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Today's Paid Sessions
            </CardTitle>
            <CardDescription>
              Your scheduled paid sessions for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaySessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {session.studentName}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Session {session.sessionNumber} of {session.totalSessions}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Time: {session.time}
                    </p>
                  </div>
                  <button 
                    className="ayat-button-primary flex items-center gap-1 px-3 py-1 text-sm"
                    onClick={() => handleCompleteSession(session.id)}
                  >
                    <CheckCircle className="h-3 w-3" />
                    Complete
                  </button>
                </div>
              ))}
              {todaySessions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No paid sessions today</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Navigate to key teacher functions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <a 
                href="/teacher/paid-registration" 
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Paid Registration</p>
                  <p className="text-sm text-muted-foreground">Complete paid student setup</p>
                </div>
              </a>
              <a 
                href="/teacher/session-management" 
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Session Management</p>
                  <p className="text-sm text-muted-foreground">Manage ongoing sessions</p>
                </div>
              </a>
              <a 
                href="/teacher/trials" 
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Users className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">Trial Management</p>
                  <p className="text-sm text-muted-foreground">Handle trial appointments</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherHomepage;
