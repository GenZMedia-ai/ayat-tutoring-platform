import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { useTeacherAvailability } from '@/hooks/useTeacherAvailability';
import { useServerDate } from '@/hooks/useServerDate';
import { Trash2, Lock, Eye } from 'lucide-react';

const TeacherDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { timeSlots, loading, toggleAvailability } = useTeacherAvailability(selectedDate);
  const { isDateToday, loading: dateLoading } = useServerDate();
  
  // Check if selected date is today according to server
  const isSelectedDateToday = isDateToday(selectedDate);
  
  // Mock data for other sections
  const teacherStats = {
    capacity: 8,
    maxCapacity: 10,
    pendingTrials: 2,
    todaySessions: 3,
    monthlyEarnings: 1250
  };

  const pendingStudents = [
    { id: '1', name: 'Ahmed Hassan', age: 12, trialDate: '2025-01-16', trialTime: '18:00', phone: '+201234567890' },
    { id: '2', name: 'Sara Mohamed', age: 15, trialDate: '2025-01-17', trialTime: '19:30', phone: '+201234567891' }
  ];

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

  const handleConfirmTrial = (studentId: string) => {
    toast.success('Trial confirmed successfully!');
  };

  const handleCompleteSession = (sessionId: string) => {
    toast.success('Session marked as completed!');
  };

  const renderTimeSlotButton = (slot: { time: string; isAvailable: boolean; isBooked: boolean }) => {
    const isDisabled = loading || dateLoading || (isSelectedDateToday && !slot.isBooked);

    if (slot.isBooked) {
      // Booked slots - black with red lock icon (always shown, never interactive)
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
      // Available slots
      if (isSelectedDateToday) {
        // Today's available slots - show as view-only with eye icon
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
        // Future available slots - interactive with trash icon on hover
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

    // Unavailable slots
    if (isSelectedDateToday) {
      // Today's unavailable slots - show as view-only
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
      // Future unavailable slots - interactive
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
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trials">Trial Sessions</TabsTrigger>
          <TabsTrigger value="sessions">Paid Sessions</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Students Requiring WhatsApp Contact</CardTitle>
                <CardDescription>
                  Contact these students to confirm their trial sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <h4 className="font-medium">{student.name}</h4>
                        <p className="text-sm text-muted-foreground">Age: {student.age}</p>
                        <p className="text-sm text-muted-foreground">
                          Trial: {student.trialDate} at {student.trialTime}
                        </p>
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
                  {pendingStudents.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No pending contacts</p>
                  )}
                </div>
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

        <TabsContent value="trials" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Trial Session Management</CardTitle>
              <CardDescription>
                Manage trial sessions and confirmations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingStudents.map((student) => (
                  <div key={student.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-medium">{student.name}</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Age:</span> {student.age}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Phone:</span> {student.phone}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Trial Date:</span> {student.trialDate}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Trial Time:</span> {student.trialTime}
                          </div>
                        </div>
                        <Badge className="status-pending">Pending Confirmation</Badge>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleContactStudent(student.id, student.phone)}
                        >
                          WhatsApp Contact
                        </Button>
                        <Button 
                          size="sm"
                          className="ayat-button-primary"
                          onClick={() => handleConfirmTrial(student.id)}
                        >
                          Confirm Appointment
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
      </Tabs>
    </div>
  );
};

export default TeacherDashboard;
