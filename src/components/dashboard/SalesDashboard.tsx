
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';

const SalesDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Mock data
  const salesStats = {
    todayTrials: 5,
    pendingFollowup: 8,
    monthlyConversions: 24,
    thisWeekBookings: 12
  };

  const availableSlots = [
    { time: '16:00-16:30', teachers: 3 },
    { time: '16:30-17:00', teachers: 5 },
    { time: '17:00-17:30', teachers: 2 },
    { time: '18:00-18:30', teachers: 4 },
    { time: '18:30-19:00', teachers: 6 },
    { time: '19:00-19:30', teachers: 3 }
  ];

  const followupStudents = [
    { id: '1', name: 'Ahmed Hassan', trialDate: '2025-01-15', status: 'trial-completed', teacher: 'Sara Mohamed' },
    { id: '2', name: 'Layla Ali', trialDate: '2025-01-14', status: 'trial-completed', teacher: 'Omar Ahmed' }
  ];

  const handleQuickBooking = (timeSlot: string) => {
    toast.success(`Booking initiated for ${timeSlot}`);
  };

  const handleFollowup = (studentId: string, phone: string = '+201234567890') => {
    const message = encodeURIComponent(
      "Hello! I hope your trial session went well. I'd like to discuss our learning packages with you."
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    toast.success('WhatsApp opened for follow-up');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-primary">Sales Dashboard</h2>
        <Badge variant="outline" className="text-xs">
          Sales Agent Access
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Trials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{salesStats.todayTrials}</div>
            <p className="text-xs text-muted-foreground">Booked today</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-up</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{salesStats.pendingFollowup}</div>
            <p className="text-xs text-muted-foreground">Require contact</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{salesStats.monthlyConversions}</div>
            <p className="text-xs text-muted-foreground">Trials to paid</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Week Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{salesStats.thisWeekBookings}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="quick-checker" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick-checker">Quick Availability</TabsTrigger>
          <TabsTrigger value="booking">Trial Booking</TabsTrigger>
          <TabsTrigger value="followup">Follow-up Management</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-checker" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Quick Availability Checker</CardTitle>
              <CardDescription>
                Find available time slots instantly for new trial bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Teacher Type</Label>
                      <Select defaultValue="mixed">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kids">Kids</SelectItem>
                          <SelectItem value="adult">Adult</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select defaultValue="egypt">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="egypt">Egypt (GMT+2)</SelectItem>
                          <SelectItem value="saudi">Saudi (GMT+3)</SelectItem>
                          <SelectItem value="uae">UAE (GMT+4)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Hour</Label>
                      <Select defaultValue="16">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="14">2:00 PM</SelectItem>
                          <SelectItem value="15">3:00 PM</SelectItem>
                          <SelectItem value="16">4:00 PM</SelectItem>
                          <SelectItem value="17">5:00 PM</SelectItem>
                          <SelectItem value="18">6:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>End Hour</Label>
                      <Select defaultValue="20">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="18">6:00 PM</SelectItem>
                          <SelectItem value="19">7:00 PM</SelectItem>
                          <SelectItem value="20">8:00 PM</SelectItem>
                          <SelectItem value="21">9:00 PM</SelectItem>
                          <SelectItem value="22">10:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">
                    Available Slots for {selectedDate?.toDateString()}
                  </h4>
                  <div className="space-y-2">
                    {availableSlots.map((slot) => (
                      <div key={slot.time} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <span className="font-medium">{slot.time}</span>
                          <p className="text-sm text-muted-foreground">
                            {slot.teachers} teachers available
                          </p>
                        </div>
                        <Button 
                          size="sm"
                          className="ayat-button-primary"
                          onClick={() => handleQuickBooking(slot.time)}
                        >
                          Book Now
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="booking" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Student Trial Booking</CardTitle>
              <CardDescription>
                Book trial sessions for new students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 mb-6">
                  <Button className="ayat-button-primary">Single Student</Button>
                  <Button variant="outline">Multi Students (Family)</Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Student Name</Label>
                    <Input placeholder="Ahmed Hassan" />
                  </div>
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input type="number" placeholder="12" />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="egypt">Egypt</SelectItem>
                        <SelectItem value="saudi">Saudi Arabia</SelectItem>
                        <SelectItem value="uae">UAE</SelectItem>
                        <SelectItem value="qatar">Qatar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp Phone</Label>
                    <Input placeholder="+201234567890" />
                  </div>
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="google-meet">Google Meet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Teacher Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kids">Kids</SelectItem>
                        <SelectItem value="adult">Adult</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input placeholder="Any special requirements or notes" />
                </div>

                <Button className="w-full ayat-button-primary">
                  Book Trial Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followup" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Follow-up Management</CardTitle>
              <CardDescription>
                Contact students who completed their trial sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {followupStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{student.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Trial Date: {student.trialDate}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Teacher: {student.teacher}
                      </p>
                      <Badge className="status-trial-completed">Trial Completed</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleFollowup(student.id)}
                      >
                        WhatsApp Follow-up
                      </Button>
                      <Button 
                        size="sm"
                        className="ayat-button-primary"
                      >
                        Create Payment Link
                      </Button>
                    </div>
                  </div>
                ))}
                {followupStudents.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No pending follow-ups</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesDashboard;
