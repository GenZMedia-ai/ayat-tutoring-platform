
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useSimpleSalesAvailability, SimpleBookingData } from '@/hooks/useSimpleSalesAvailability';
import { useFamilyGroups } from '@/hooks/useFamilyGroups';
import { TEACHER_TYPES } from '@/constants/teacherTypes';
import { HOURLY_TIME_SLOTS, TIMEZONES } from '@/constants/timeSlots';
import { BookingModal } from '@/components/booking/BookingModal';
import { FamilyCard } from '@/components/family/FamilyCard';
import { supabase } from '@/integrations/supabase/client';

const SimpleSalesDashboard: React.FC = () => {
  // FIXED: Use UTC date to prevent timezone conversion issues
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const utcDate = new Date(Date.UTC(2025, 5, 22)); // Month is 0-indexed, June 22nd
    return utcDate;
  });
  const [timezone, setTimezone] = useState('qatar');
  const [teacherType, setTeacherType] = useState('mixed');
  const [selectedHour, setSelectedHour] = useState(14);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [salesStats, setSalesStats] = useState({
    todayTrials: 0,
    pendingFollowup: 0,
    monthlyConversions: 0,
    thisWeekBookings: 0,
    familyGroups: 0
  });

  const { loading, availableSlots, checkAvailability, bookTrialSession } = useSimpleSalesAvailability();
  const { familyGroups, loading: familyLoading, fetchFamilyGroups, updateFamilyStatus } = useFamilyGroups();

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

        // Today's trials (individual students)
        const { count: todayTrials } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .eq('trial_date', today);

        // Pending follow-up (individual students)
        const { count: pendingFollowup } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .eq('status', 'trial-completed');

        // Monthly conversions (individual students)
        const { count: monthlyConversions } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .eq('status', 'paid')
          .gte('created_at', monthStart.toISOString());

        // This week's bookings (individual students)
        const { count: thisWeekBookings } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .gte('created_at', weekStart.toISOString());

        // Family groups count
        const { count: familyGroups } = await supabase
          .from('family_groups')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id);

        setSalesStats({
          todayTrials: todayTrials || 0,
          pendingFollowup: pendingFollowup || 0,
          monthlyConversions: monthlyConversions || 0,
          thisWeekBookings: thisWeekBookings || 0,
          familyGroups: familyGroups || 0
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
    
    checkAvailability(selectedDate, timezone, teacherType, selectedHour);
  };

  const handleBookNow = (slot: any) => {
    setSelectedSlot(slot);
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (data: SimpleBookingData, isMultiStudent: boolean) => {
    if (!selectedDate || !selectedSlot) return false;
    
    const success = await bookTrialSession(
      data,
      selectedDate,
      selectedSlot,
      teacherType,
      isMultiStudent
    );
    
    if (success) {
      setTimeout(() => {
        handleSearchAvailability();
        fetchFamilyGroups();
      }, 1000);
    }
    
    return success;
  };

  const handleFamilyContact = (family: any) => {
    const message = `Hello ${family.parent_name}, this is regarding your family trial session. Please let us know if you have any questions.`;
    const whatsappUrl = `https://wa.me/${family.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-primary">Sales Command Center</h2>
        <Badge variant="outline" className="text-xs">
          Sales Agent Dashboard
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Trials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{salesStats.todayTrials}</div>
            <p className="text-xs text-muted-foreground">Individual students</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Family Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{salesStats.familyGroups}</div>
            <p className="text-xs text-muted-foreground">Multi-student families</p>
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

      {/* Main Content with Tabs */}
      <Tabs defaultValue="booking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="booking">Quick Availability Checker</TabsTrigger>
          <TabsTrigger value="families">Family Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="booking" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Quick Availability Checker</CardTitle>
              <CardDescription>
                Search and book available trial session slots for both individual and family bookings
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
                    onSelect={(date) => {
                      if (date) {
                        // Convert selected date to UTC to prevent timezone issues
                        const utcDate = new Date(Date.UTC(
                          date.getFullYear(),
                          date.getMonth(),
                          date.getDate()
                        ));
                        setSelectedDate(utcDate);
                      }
                    }}
                    className="rounded-md border"
                    disabled={(date) => date < new Date('2025-06-21')}
                  />

                  <Button 
                    onClick={handleSearchAvailability}
                    className="w-full ayat-button-primary"
                    disabled={loading}
                  >
                    {loading ? 'Searching...' : 'Search Available Slots'}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      Available 30-Minute Slots for {selectedDate?.toDateString()}
                    </h4>
                    <div className="text-xs text-muted-foreground">
                      Date: {selectedDate?.toISOString().split('T')[0]}
                    </div>
                  </div>
                  
                  {loading && (
                    <div className="text-center py-8 text-muted-foreground">
                      Searching for slots on {selectedDate?.toISOString().split('T')[0]}...
                    </div>
                  )}
                  
                  {!loading && availableSlots.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground space-y-2">
                      <p>No available slots found for {selectedDate?.toDateString()}.</p>
                      <p className="text-sm">Try selecting a different date or time.</p>
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
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="families" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Family Groups Management</CardTitle>
              <CardDescription>
                Manage family trial sessions and group bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {familyLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  Loading family groups...
                </div>
              )}
              
              {!familyLoading && familyGroups.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No family groups found.</p>
                  <p className="text-sm">Family bookings will appear here once created.</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {familyGroups.map((family) => (
                  <FamilyCard
                    key={family.id}
                    family={family}
                    onContact={() => handleFamilyContact(family)}
                    onEdit={() => {
                      toast.info('Edit family functionality coming soon');
                    }}
                    onStatusChange={(status) => updateFamilyStatus(family.id, status)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
