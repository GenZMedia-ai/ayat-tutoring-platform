import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { useSalesAvailability, BookingData } from '@/hooks/useSalesAvailability';
import { TEACHER_TYPES } from '@/constants/teacherTypes';
import { HOURLY_TIME_SLOTS, TIMEZONES } from '@/constants/timeSlots';
import { BookingModal } from '@/components/booking/BookingModal';
import { supabase } from '@/integrations/supabase/client';

const SalesDashboard: React.FC = () => {
  // Set default date to 2025-06-20 where we know there's test data
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date('2025-06-20'));
  const [timezone, setTimezone] = useState('saudi');
  const [teacherType, setTeacherType] = useState('mixed');
  const [selectedHour, setSelectedHour] = useState(18); // Default to 6 PM
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [salesStats, setSalesStats] = useState({
    todayTrials: 0,
    pendingFollowup: 0,
    monthlyConversions: 0,
    thisWeekBookings: 0
  });

  const { loading, availableSlots, checkAvailability, bookTrialSession } = useSalesAvailability();

  // Load sales statistics
  useEffect(() => {
    const loadSalesStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const monthStart = new Date();
        monthStart.setDate(1);

        // Today's trials
        const { count: todayTrials } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .eq('trial_date', today);

        // Pending follow-up (trial completed but not converted)
        const { count: pendingFollowup } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .eq('status', 'trial-completed');

        // Monthly conversions (trial-completed to paid)
        const { count: monthlyConversions } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .eq('status', 'paid')
          .gte('created_at', monthStart.toISOString());

        // This week's bookings
        const { count: thisWeekBookings } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .gte('created_at', weekStart.toISOString());

        setSalesStats({
          todayTrials: todayTrials || 0,
          pendingFollowup: pendingFollowup || 0,
          monthlyConversions: monthlyConversions || 0,
          thisWeekBookings: thisWeekBookings || 0
        });
      } catch (error) {
        console.error('Error loading sales stats:', error);
      }
    };

    loadSalesStats();
  }, []);

  const handleSearchAvailability = () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    console.log('Searching availability with parameters:', {
      date: selectedDate,
      timezone,
      teacherType,
      selectedHour
    });
    checkAvailability(selectedDate, timezone, teacherType, selectedHour);
  };

  const handleBookNow = (slot: any) => {
    setSelectedSlot(slot);
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (data: BookingData, isMultiStudent: boolean) => {
    if (!selectedDate || !selectedSlot) return false;
    
    const success = await bookTrialSession(
      data,
      selectedDate,
      selectedSlot,
      teacherType,
      isMultiStudent
    );
    
    if (success) {
      // Refresh availability after booking
      handleSearchAvailability();
    }
    
    return success;
  };

  const handleFollowup = (studentId: string, phone: string = '+966501234567') => {
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
              <CardTitle>Real-Time Availability Checker</CardTitle>
              <CardDescription>
                Find exact 30-minute slots with real database data and timezone-accurate times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Testing Note:</strong> Try date 2025-06-20 with Mixed teacher type and any time to see test data.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Teacher Type</Label>
                      <Select value={teacherType} onValueChange={setTeacherType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEACHER_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Client Timezone</Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Preferred Time</Label>
                    <Select value={selectedHour.toString()} onValueChange={(value) => setSelectedHour(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURLY_TIME_SLOTS.map((timeSlot) => (
                          <SelectItem key={timeSlot.value} value={timeSlot.value.toString()}>
                            {timeSlot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date('2025-06-19')}
                  />

                  <Button 
                    onClick={handleSearchAvailability}
                    className="w-full ayat-button-primary"
                    disabled={loading}
                  >
                    {loading ? 'Searching...' : 'Check Availability'}
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">
                    Available Slots for {selectedDate?.toDateString()}
                  </h4>
                  
                  {loading && (
                    <div className="text-center py-8 text-muted-foreground">
                      Searching for real-time availability...
                    </div>
                  )}
                  
                  {!loading && availableSlots.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground space-y-2">
                      <p>No available slots found for the selected criteria.</p>
                      <p className="text-sm">Check the browser console for detailed debugging information.</p>
                      <p className="text-xs">Try: 2025-06-20, Mixed teacher, any time for test data.</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {availableSlots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                        <div className="space-y-1">
                          <div className="font-medium text-primary">
                            {slot.clientTimeDisplay}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {slot.egyptTimeDisplay}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Teacher: {slot.teacherName} ({slot.teacherType})
                          </div>
                          <div className="text-xs text-green-600">
                            UTC: {slot.utcStartTime} - {slot.utcEndTime}
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          className="ayat-button-primary"
                          onClick={() => handleBookNow(slot)}
                        >
                          Book Slot
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {availableSlots.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Found {availableSlots.length} available slot(s)</strong> from {new Set(availableSlots.map(s => s.teacherId)).size} qualified teacher(s)
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        All times shown are real data from the database with accurate timezone conversion
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="booking" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Quick Booking via Availability Checker</CardTitle>
              <CardDescription>
                Use the Quick Availability Checker above to find and book available slots instantly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Go to the Quick Availability tab to search for available slots and book trials.</p>
                <p className="text-sm mt-2">This streamlined process takes less than 2 minutes!</p>
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
                <div className="text-center py-8 text-muted-foreground">
                  <p>Follow-up students will appear here after trial sessions are completed.</p>
                  <p className="text-sm mt-2">Check back after teachers update trial outcomes.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSubmit={handleBookingSubmit}
        selectedSlot={selectedSlot ? `${selectedSlot.clientTimeDisplay} (${selectedSlot.egyptTimeDisplay})` : ''}
        selectedDate={selectedDate || new Date()}
      />
    </div>
  );
};

export default SalesDashboard;
