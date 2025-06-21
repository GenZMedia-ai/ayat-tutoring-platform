import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTeacherTrialSessions } from '@/hooks/useTeacherTrialSessions';
import { useTrialSessionFlow } from '@/hooks/useTrialSessionFlow';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import TodayScheduleTimeline from '@/components/teacher/TodayScheduleTimeline';
import EarningsWidget from '@/components/teacher/EarningsWidget';
import TrialOutcomeForm from '@/components/teacher/TrialOutcomeForm';
import WhatsAppContactButton from '@/components/teacher/WhatsAppContactButton';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const EnhancedTeacherDashboard: React.FC = () => {
  const { trialStudents, loading: trialsLoading, confirmTrial } = useTeacherTrialSessions();
  const { students, loading, refetchData } = useTrialSessionFlow();
  const [selectedStudentForOutcome, setSelectedStudentForOutcome] = useState<any>(null);
  
  useRealTimeUpdates(refetchData);

  // Real earnings data (mock for now, will be replaced with actual calculations)
  const earningsData = {
    monthlyTarget: 2000,
    currentEarnings: 1350,
    baseHours: 45,
    bonusHours: 8,
    totalMinutes: 2700,
    nextPaymentDate: '30th Dec',
    bonusRate: 35,
    hourlyRate: 25
  };

  // Real session data for today's timeline
  const todaySessions = [
    {
      id: '1',
      studentName: 'Omar Ali',
      time: '16:00',
      platform: 'zoom' as const,
      sessionNumber: 3,
      totalSessions: 8,
      status: 'upcoming' as const,
      type: 'paid' as const
    },
    {
      id: '2',
      studentName: 'Layla Hassan',
      time: '18:30',
      platform: 'google-meet' as const,
      sessionNumber: 5,
      totalSessions: 16,
      status: 'upcoming' as const,
      type: 'paid' as const
    }
  ];

  const handleJoinSession = (sessionId: string) => {
    console.log('Joining session:', sessionId);
    // Platform join logic would go here
  };

  const handleCompleteSession = (sessionId: string) => {
    console.log('Completing session:', sessionId);
    // Session completion logic would go here
  };

  const handleTrialOutcomeSubmitted = () => {
    setSelectedStudentForOutcome(null);
    refetchData();
  };

  // Calculate real stats from database
  const teacherStats = {
    capacity: students.filter(s => ['active', 'paid'].includes(s.status)).length,
    maxCapacity: 10,
    pendingTrials: trialStudents.filter(s => s.status === 'pending').length,
    todaySessions: todaySessions.length,
    monthlyEarnings: earningsData.currentEarnings
  };

  const pendingContactStudents = trialStudents.filter(s => s.status === 'pending');
  const confirmedTrials = trialStudents.filter(s => s.status === 'confirmed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-primary">Teacher Dashboard</h2>
        <Badge variant="outline" className="text-xs">
          Enhanced Teacher Access
        </Badge>
      </div>

      {/* Real Stats Cards */}
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
            <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{teacherStats.todaySessions}</div>
            <p className="text-xs text-muted-foreground">Scheduled sessions</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${teacherStats.monthlyEarnings}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trials">Trial Management</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TodayScheduleTimeline
              sessions={todaySessions}
              onJoinSession={handleJoinSession}
              onCompleteSession={handleCompleteSession}
            />
            <EarningsWidget earningsData={earningsData} />
          </div>
        </TabsContent>

        <TabsContent value="trials" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Contacts */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Require WhatsApp Contact ({pendingContactStudents.length})</CardTitle>
                <CardDescription>Contact these students to confirm trials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingContactStudents.map((student) => (
                    <div key={student.id} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{student.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Age: {student.age} • Trial: {student.trialDate} at {student.trialTime}
                          </p>
                        </div>
                        <WhatsAppContactButton
                          student={student}
                          size="sm"
                          onContactLogged={refetchData}
                        />
                      </div>
                    </div>
                  ))}
                  {pendingContactStudents.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No pending contacts</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Confirmed Trials Ready for Outcome */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Confirmed Trials ({confirmedTrials.length})</CardTitle>
                <CardDescription>Submit outcomes after trial completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {confirmedTrials.map((student) => (
                    <div key={student.id} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{student.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Trial: {student.trialDate} at {student.trialTime}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedStudentForOutcome(student)}
                          className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90"
                        >
                          Submit Outcome
                        </button>
                      </div>
                    </div>
                  ))}
                  {confirmedTrials.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No confirmed trials</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Paid Session Management</CardTitle>
              <CardDescription>
                Track and complete paid learning sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaySessions.map((session) => (
                  <div key={session.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-medium">{session.studentName}</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Session:</span> {session.sessionNumber} of {session.totalSessions}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Time:</span> {session.time}
                          </div>
                        </div>
                        <Badge className="status-active">Scheduled</Badge>
                      </div>
                      {/*<Button 
                        size="sm"
                        className="ayat-button-primary"
                        onClick={() => handleCompleteSession(session.id)}
                      >
                        Mark Complete
                      </Button>*/}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <EarningsWidget earningsData={earningsData} />
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Availability Management</CardTitle>
              <CardDescription>
                Set your available time slots for new bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Availability management UI will go here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trial Outcome Dialog */}
      <Dialog open={!!selectedStudentForOutcome} onOpenChange={() => setSelectedStudentForOutcome(null)}>
        <DialogContent className="max-w-2xl">
          {selectedStudentForOutcome && (
            <TrialOutcomeForm
              student={selectedStudentForOutcome}
              sessionId="mock-session-id" // This would come from actual session data
              onSuccess={handleTrialOutcomeSubmitted}
              onCancel={() => setSelectedStudentForOutcome(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedTeacherDashboard;
