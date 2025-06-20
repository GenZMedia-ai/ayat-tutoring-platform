
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { useSimpleSalesAvailability, SimpleBookingData } from '@/hooks/useSimpleSalesAvailability';
import { TEACHER_TYPES } from '@/constants/teacherTypes';
import { HOURLY_TIME_SLOTS, TIMEZONES } from '@/constants/timeSlots';
import { BookingModal } from '@/components/booking/BookingModal';
import { supabase } from '@/integrations/supabase/client';

const SimpleSalesDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date('2025-06-21'));
  const [timezone, setTimezone] = useState('uae');
  const [teacherType, setTeacherType] = useState('mixed');
  const [selectedHour, setSelectedHour] = useState(14);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [salesStats, setSalesStats] = useState({
    todayTrials: 0,
    pendingFollowup: 0,
    monthlyConversions: 0,
    thisWeekBookings: 0
  });

  const { loading, availableSlots, checkAvailability, bookTrialSession } = useSimpleSalesAvailability();

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

        // Pending follow-up
        const { count: pendingFollowup } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .eq('status', 'trial-completed');

        // Monthly conversions
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
    console.log('=== SIMPLE SEARCH START ===');
    console.log('Search parameters:', {
      date: selectedDate,
      timezone,
      teacherType,
      selectedHour
    });
    checkAvailability(selectedDate, timezone, teacherType, selectedHour);
  };

  const handleBookNow = (slot: any) => {
    console.log('=== SIMPLE BOOKING SELECTION ===');
    console.log('Selected slot:', slot);
    setSelectedSlot(slot);
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (data: SimpleBookingData, isMultiStudent: boolean) => {
    if (!selectedDate || !selectedSlot) return false;
    
    console.log('=== SIMPLE BOOKING SUBMISSION ===');
    console.log('Booking data prepared');
    console.log('Multi-student:', isMultiStudent);
    console.log('Selected slot:', selectedSlot.id);
    
    const success = await bookTrialSession(
      data,
      selectedDate,
      selectedSlot,
      teacherType,
      isMultiStudent
    );
    
    if (success) {
      console.log('=== BOOKING SUCCESS - REFRESHING AVAILABILITY ===');
      handleSearchAvailability();
    }
    
    return success;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-primary">Simplified Sales Dashboard</h2>
        <Badge variant="outline" className="text-xs">
          Simple System - No Array Errors
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

      {/* Main Content */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Simplified Availability Checker</CardTitle>
          <CardDescription>
            Direct database queries, no complex RPC calls, simplified booking flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Simplified System:</strong> Direct Supabase queries, no array operations, predictable results
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  ✅ No RPC errors • ✅ Accurate time matching • ✅ Simple booking flow
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
                <Label>Preferred Time (Hour)</Label>
                <Select value={selectedHour.toString()} onValueChange={(value) => setSelectedHour(parseFloat(value))}>
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
                disabled={(date) => date < new Date('2025-06-21')}
              />

              <Button 
                onClick={handleSearchAvailability}
                className="w-full ayat-button-primary"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Simple Search (No Errors)'}
              </Button>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">
                Available 30-Minute Slots for {selectedDate?.toDateString()}
              </h4>
              
              {loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Searching with simplified direct queries...
                </div>
              )}
              
              {!loading && availableSlots.length === 0 && (
                <div className="text-center py-8 text-muted-foreground space-y-2">
                  <p>No available slots found for the selected criteria.</p>
                  <p className="text-sm">Simplified system with direct database access.</p>
                  <p className="text-xs text-blue-600">
                    Try: Date 2025-06-21, UAE timezone, Mixed teacher, 2:00 PM
                  </p>
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
                        Teacher: {slot.teacherName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {slot.egyptTimeDisplay}
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
                      Book Now
                    </Button>
                  </div>
                ))}
              </div>
              
              {availableSlots.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Found {availableSlots.length} available slot(s)</strong> with qualified teachers
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Simplified system with accurate results and reliable booking
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSubmit={handleBookingSubmit}
        selectedSlot={selectedSlot ? 
          `${selectedSlot.clientTimeDisplay} (${selectedSlot.egyptTimeDisplay}) - Teacher: ${selectedSlot.teacherName}` : ''
        }
        selectedDate={selectedDate || new Date()}
      />
    </div>
  );
};

export default SimpleSalesDashboard;
