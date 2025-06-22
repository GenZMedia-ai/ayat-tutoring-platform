
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTeacherTrialSessions } from '@/hooks/useTeacherTrialSessions';
import { useWhatsAppContact } from '@/hooks/useWhatsAppContact';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';

const TeacherHomepage: React.FC = () => {
  const { trialStudents, loading: trialsLoading, confirmTrial, refreshTrialSessions } = useTeacherTrialSessions();
  const { logContact, openWhatsApp } = useWhatsAppContact();

  // Calculate stats from trial students data
  const teacherStats = {
    capacity: 8,
    maxCapacity: 10,
    pendingTrials: trialStudents.filter(s => s.status === 'pending').length,
    confirmedTrials: trialStudents.filter(s => s.status === 'confirmed').length,
    completedTrials: trialStudents.filter(s => s.status === 'trial-completed').length,
    todaySessions: 3,
    monthlyEarnings: 1250
  };

  // Mock data for today's sessions
  const todaySessions = [
    { id: '1', studentName: 'Omar Ali', time: '16:00', sessionNumber: 3, totalSessions: 8 },
    { id: '2', studentName: 'Layla Hassan', time: '18:30', sessionNumber: 5, totalSessions: 16 },
    { id: '3', studentName: 'Youssef Ahmed', time: '20:00', sessionNumber: 1, totalSessions: 8 }
  ];

  const handleContactStudent = async (studentId: string, phone: string) => {
    try {
      openWhatsApp(phone);
      await logContact(studentId, 'trial_confirmation', true, 'WhatsApp contact initiated by teacher');
      await refreshTrialSessions();
    } catch (error) {
      console.error('Error handling contact:', error);
    }
  };

  const handleConfirmTrial = async (studentId: string) => {
    const success = await confirmTrial(studentId);
    if (success) {
      console.log('✅ Trial confirmed successfully for student:', studentId);
    }
  };

  const handleCompleteSession = (sessionId: string) => {
    console.log('Session completed:', sessionId);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Completed Trials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{teacherStats.completedTrials}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Students Requiring WhatsApp Contact</CardTitle>
            <CardDescription>
              Contact these students to confirm their trial sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trialsLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-muted-foreground">Loading trial sessions...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {trialStudents.filter(s => s.status === 'pending').map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium">{student.name}</h4>
                      <p className="text-sm text-muted-foreground">Age: {student.age}</p>
                      <p className="text-sm text-muted-foreground">
                        Trial: {student.trialDate} at {student.trialTime}
                      </p>
                      {student.parentName && (
                        <p className="text-sm text-muted-foreground">Parent: {student.parentName}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleContactStudent(student.id, student.phone)}
                      >
                        Contact
                      </Button>
                      <Button 
                        size="sm"
                        className="ayat-button-primary"
                        onClick={() => handleConfirmTrial(student.id)}
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                ))}
                {trialStudents.filter(s => s.status === 'pending').length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No pending contacts</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Today's Paid Sessions</CardTitle>
            <CardDescription>
              Your scheduled sessions for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaySessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium">{session.studentName}</h4>
                    <p className="text-sm text-muted-foreground">
                      Session {session.sessionNumber} of {session.totalSessions}
                    </p>
                    <p className="text-sm text-muted-foreground">Time: {session.time}</p>
                  </div>
                  <Button 
                    size="sm"
                    className="ayat-button-primary"
                    onClick={() => handleCompleteSession(session.id)}
                  >
                    Complete
                  </Button>
                </div>
              ))}
              {todaySessions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No sessions today</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherHomepage;
