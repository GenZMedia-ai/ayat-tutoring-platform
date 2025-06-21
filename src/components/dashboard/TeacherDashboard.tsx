import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { useTeacherAvailability } from '@/hooks/useTeacherAvailability';
import { useServerDate } from '@/hooks/useServerDate';
import { useTeacherTrialSessions } from '@/hooks/useTeacherTrialSessions';
import { useStudentStatusManagement } from '@/hooks/useStudentStatusManagement';
import { TeacherStudentCard } from '@/components/teacher/TeacherStudentCard';
import { RescheduleModal } from '@/components/teacher/RescheduleModal';
import { Trash2, Lock, Eye } from 'lucide-react';
import { TrialStudent } from '@/hooks/useTeacherTrialSessions';

const TeacherDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [rescheduleStudent, setRescheduleStudent] = useState<TrialStudent | null>(null);
  const { timeSlots, loading, toggleAvailability } = useTeacherAvailability(selectedDate);
  const { isDateToday, loading: dateLoading } = useServerDate();
  const { trialStudents, loading: trialsLoading, confirmTrial, refreshTrialSessions } = useTeacherTrialSessions();
  const { updateStudentStatus, rescheduleStudent: performReschedule } = useStudentStatusManagement();
  
  // Check if selected date is today according to server
  const isSelectedDateToday = isDateToday(selectedDate);
  
  // Calculate real stats from trial students data
  const teacherStats = {
    capacity: 8, // This could be made dynamic later
    maxCapacity: 10, // This could be made dynamic later
    pendingTrials: trialStudents.filter(s => s.status === 'pending').length,
    todaySessions: 3, // Mock data for now - could be calculated from sessions
    monthlyEarnings: 1250 // Mock data for now
  };

  // Mock data for today's sessions (Phase 4 will replace this)
  const todaySessions = [
    { id: '1', studentName: 'Omar Ali', time: '16:00', sessionNumber: 3, totalSessions: 8 },
    { id: '2', studentName: 'Layla Hassan', time: '18:30', sessionNumber: 5, totalSessions: 16 },
    { id: '3', studentName: 'Youssef Ahmed', time: '20:00', sessionNumber: 1, totalSessions: 8 }
  ];

  const handleContactStudent = (studentId: string, phone: string) => {
    const message = encodeURIComponent(
      "Hello! I'm your assigned teacher from Ayat w Bian. I'd like to confirm your trial session details and introduce myself."
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    toast.success('WhatsApp opened. Please contact the student.');
  };

  const handleConfirmTrial = async (studentId: string) => {
    const success = await confirmTrial(studentId);
    if (!success) {
      console.log('Failed to confirm trial for student:', studentId);
    }
  };

  const handleStatusChange = async (studentId: string, newStatus: string) => {
    const success = await updateStudentStatus(studentId, newStatus);
    if (success) {
      refreshTrialSessions();
    }
  };

  const handleReschedule = (student: TrialStudent) => {
    setRescheduleStudent(student);
  };

  const handleRescheduleSuccess = () => {
    setRescheduleStudent(null);
    refreshTrialSessions();
  };

  const handleCompleteSession = (sessionId: string) => {
    toast.success('Session marked as completed!');
  };

  // Render time slot button based on availability status
  const renderTimeSlotButton = (slot: { time: string; isAvailable: boolean; isBooked: boolean }) => {
    const isDisabled = loading || dateLoading || (isSelectedDateToday && !slot.isBooked);

    if (slot.isBooked) {
      return (
        <Button
          key={slot.time}
          size="sm"
          disabled
          className="bg-black text-white hover:bg-black cursor-not-allowed relative"
        >
          <Lock className="w-3 h-3 text-red-500 absolute top-1 right-1" />
          {slot.time}
        </Button>
      );
    }

    if (slot.isAvailable) {
      if (isSelectedDateToday) {
        return (
          <Button
            key={slot.time}
            size="sm"
            disabled
            className="ayat-button-primary opacity-60 cursor-not-allowed relative"
          >
            <Eye className="w-3 h-3 absolute top-1 right-1 opacity-60" />
            {slot.time}
          </Button>
        );
      } else {
        return (
          <Button
            key={slot.time}
            size="sm"
            className="ayat-button-primary relative group"
            onClick={() => toggleAvailability(slot.time)}
            disabled={isDisabled}
          >
            <Trash2 className="w-3 h-3 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            {slot.time}
          </Button>
        );
      }
    }

    if (isSelectedDateToday) {
      return (
        <Button
          key={slot.time}
          size="sm"
          variant="outline"
          disabled
          className="opacity-60 cursor-not-allowed"
        >
          {slot.time}
        </Button>
      );
    } else {
      return (
        <Button
          key={slot.time}
          size="sm"
          variant="outline"
          onClick={() => toggleAvailability(slot.time)}
          disabled={isDisabled}
        >
          {slot.time}
        </Button>
      );
    }
  };

  const ComingSoonCard = ({ title, description }: { title: string; description: string }) => (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <p className="text-muted-foreground text-lg font-medium">Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-2">This feature is under development</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-primary">Teacher Dashboard</h2>
        <Badge variant="outline" className="text-xs">
          Teacher Access
        </Badge>
      </div>

      {/* Stats Cards */}
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="homepage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="availability">Add Availability</TabsTrigger>
          <TabsTrigger value="trials">Trial Appointments</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="homepage" className="space-y-4">
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
                  <p className="text-center text-muted-foreground py-8">Loading trial sessions...</p>
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
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Availability Management</CardTitle>
              <CardDescription>
                Set your available time slots for new bookings (times shown in Egypt time)
                {isSelectedDateToday && (
                  <span className="block text-orange-600 font-medium mt-1">
                    ⚠️ Today's schedule is locked - you can only view existing availability
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date()}
                  />
                  {isSelectedDateToday && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        <strong>Today's Schedule Locked:</strong> You cannot modify today's availability to prevent disruption of confirmed bookings. You can view your current schedule and all future dates remain editable.
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">
                    Time Slots for {selectedDate?.toDateString()}
                    {isSelectedDateToday && (
                      <span className="text-sm text-orange-600 ml-2">(View Only)</span>
                    )}
                  </h4>
                  {loading || dateLoading ? (
                    <p className="text-sm text-muted-foreground">Loading availability...</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {isSelectedDateToday 
                            ? 'Viewing today\'s schedule (no modifications allowed)'
                            : 'Click to toggle availability. Hover over available slots to remove them.'
                          }
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.map(renderTimeSlotButton)}
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h5 className="text-sm font-medium mb-2">Legend:</h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-primary rounded"></div>
                            <span>
                              {isSelectedDateToday ? 'Available (view only)' : 'Available (hover to remove)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border border-gray-300 rounded"></div>
                            <span>
                              {isSelectedDateToday ? 'Not available (view only)' : 'Not available (click to add)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-black rounded relative">
                              <Lock className="w-2 h-2 text-red-500 absolute top-0.5 right-0.5" />
                            </div>
                            <span>Booked (locked)</span>
                          </div>
                          {isSelectedDateToday && (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-primary opacity-60 rounded relative">
                                <Eye className="w-2 h-2 absolute top-0.5 right-0.5" />
                              </div>
                              <span>Today's slots (read-only)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trials" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Trial Session Management</CardTitle>
              <CardDescription>
                Manage trial sessions and confirmations. Right-click on cards for more options.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trialsLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading trial sessions...</p>
              ) : (
                <>
                  {trialStudents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No trial sessions found</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {trialStudents.map((student) => (
                        <TeacherStudentCard
                          key={student.id}
                          student={student}
                          onContact={handleContactStudent}
                          onConfirm={handleConfirmTrial}
                          onStatusChange={handleStatusChange}
                          onReschedule={handleReschedule}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <ComingSoonCard 
            title="Paid Students Management" 
            description="View and manage your paid students and their learning progress"
          />
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
                      <Button 
                        size="sm"
                        className="ayat-button-primary"
                        onClick={() => handleCompleteSession(session.id)}
                      >
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <ComingSoonCard 
            title="Revenue Analytics" 
            description="Track your earnings, payment history, and revenue analytics"
          />
        </TabsContent>
      </Tabs>

      {/* Reschedule Modal */}
      <RescheduleModal
        student={rescheduleStudent}
        open={!!rescheduleStudent}
        onClose={() => setRescheduleStudent(null)}
        onSuccess={handleRescheduleSuccess}
      />
    </div>
  );
};

export default TeacherDashboard;
