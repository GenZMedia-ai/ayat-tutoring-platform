
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { useSalesAvailability, BookingData, TIME_SLOTS } from '@/hooks/useSalesAvailability';
import { BookingModal } from '@/components/booking/BookingModal';
import { supabase } from '@/integrations/supabase/client';

const SalesDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timezone, setTimezone] = useState('saudi');
  const [teacherType, setTeacherType] = useState('mixed');
  const [selectedTime, setSelectedTime] = useState('16:00:00'); // Default to 4:00 PM
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
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
    checkAvailability(selectedDate, timezone, teacherType, selectedTime);
  };

  const handleBookNow = (timeSlot: string) => {
    setSelectedSlot(timeSlot);
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (data: BookingData, isMultiStudent: boolean) => {
    if (!selectedDate) return false;
    
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

  const timezones = [
    { value: 'saudi', label: 'Saudi Arabia (GMT+3)', offset: 3 },
    { value: 'uae', label: 'UAE (GMT+4)', offset: 4 },
    { value: 'qatar', label: 'Qatar (GMT+3)', offset: 3 },
    { value: 'kuwait', label: 'Kuwait (GMT+3)', offset: 3 },
    { value: 'bahrain', label: 'Bahrain (GMT+3)', offset: 3 },
    { value: 'oman', label: 'Oman (GMT+4)', offset: 4 }
  ];

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
                      <Select value={teacherType} onValueChange={setTeacherType}>
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
                      <Label>Client Timezone</Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => (
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
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((timeSlot) => (
                          <SelectItem key={timeSlot.value} value={timeSlot.value}>
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
                    disabled={(date) => date < new Date()}
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
                      Searching for available slots...
                    </div>
                  )}
                  
                  {!loading && availableSlots.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No available slots found. Try different criteria.
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {availableSlots.map((slot) => (
                      <div key={slot.timeSlot} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <span className="font-medium">{slot.timeSlot}</span>
                          <p className="text-sm text-muted-foreground">
                            {slot.availableTeachers} teacher{slot.availableTeachers !== 1 ? 's' : ''} available
                          </p>
                        </div>
                        <Button 
                          size="sm"
                          className="ayat-button-primary"
                          onClick={() => handleBookNow(slot.timeSlot)}
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
        selectedSlot={selectedSlot}
        selectedDate={selectedDate || new Date()}
      />
    </div>
  );
};

export default SalesDashboard;
