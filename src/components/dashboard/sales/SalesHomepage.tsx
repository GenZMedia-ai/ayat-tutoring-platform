import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { toast } from 'sonner';
import { useSimpleSalesAvailability, SimpleBookingData } from '@/hooks/useSimpleSalesAvailability';
import { TEACHER_TYPES } from '@/constants/teacherTypes';
import { HOURLY_TIME_SLOTS, TIMEZONES } from '@/constants/timeSlots';
import { BookingModal } from '@/components/booking/BookingModal';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { DateRange } from 'react-day-picker';

const SalesHomepage: React.FC = () => {
  // Date filtering
  const [dateFilter, setDateFilter] = useState('today');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  
  // Quick Availability Checker state - Fixed defaults
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timezone, setTimezone] = useState('saudi');
  const [teacherType, setTeacherType] = useState('mixed');
  const [selectedHour, setSelectedHour] = useState(-1); // Default to "All Time"
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  // Stats state
  const [salesStats, setSalesStats] = useState({
    bookedTrials: { total: 0, individual: 0, family: 0 },
    completedTrials: 0,
    pendingFollowup: 0,
    conversions: { count: 0, percentage: 0 }
  });

  const { loading, availableSlots, checkAvailability, bookTrialSession } = useSimpleSalesAvailability();

  // Get date range based on filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        return { from: now, to: now };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { from: yesterday, to: yesterday };
      case 'last7days':
        return { from: subDays(now, 7), to: now };
      case 'thismonth':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'lastmonth':
        const lastMonth = subDays(startOfMonth(now), 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      case 'alltime':
        return { from: new Date('2024-01-01'), to: now };
      case 'custom':
        return customDateRange && customDateRange.from && customDateRange.to 
          ? { from: customDateRange.from, to: customDateRange.to }
          : { from: now, to: now };
      default:
        return { from: now, to: now };
    }
  };

  // Load sales statistics with date filtering
  useEffect(() => {
    const loadSalesStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { from, to } = getDateRange();
        const fromStr = format(from, 'yyyy-MM-dd');
        const toStr = format(to, 'yyyy-MM-dd');

        // Booked Trials (Individual)
        const { count: individualTrials } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .gte('created_at', fromStr)
          .lte('created_at', toStr + 'T23:59:59');

        // Booked Trials (Family)
        const { count: familyTrials } = await supabase
          .from('family_groups')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .gte('created_at', fromStr)
          .lte('created_at', toStr + 'T23:59:59');

        // Completed Trials (ready for conversion)
        const { count: completedTrials } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .eq('status', 'trial-completed')
          .gte('created_at', fromStr)
          .lte('created_at', toStr + 'T23:59:59');

        // Pending Follow-up
        const { count: pendingFollowup } = await supabase
          .from('sales_followups')
          .select('*', { count: 'exact', head: true })
          .eq('sales_agent_id', user.id)
          .eq('completed', false)
          .gte('created_at', fromStr)
          .lte('created_at', toStr + 'T23:59:59');

        // Conversions (Trial → Paid)
        const { count: paidStudents } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .eq('status', 'paid')
          .gte('created_at', fromStr)
          .lte('created_at', toStr + 'T23:59:59');

        // Calculate conversion percentage
        const totalCompleted = (completedTrials || 0) + (paidStudents || 0);
        const conversionPercentage = totalCompleted > 0 ? Math.round(((paidStudents || 0) / totalCompleted) * 100) : 0;

        setSalesStats({
          bookedTrials: {
            total: (individualTrials || 0) + (familyTrials || 0),
            individual: individualTrials || 0,
            family: familyTrials || 0
          },
          completedTrials: completedTrials || 0,
          pendingFollowup: pendingFollowup || 0,
          conversions: {
            count: paidStudents || 0,
            percentage: conversionPercentage
          }
        });
      } catch (error) {
        console.error('Error loading sales stats:', error);
      }
    };

    loadSalesStats();
  }, [dateFilter, customDateRange]);

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
      }, 1000);
    }
    
    return success;
  };

  // Group slots by time range and count teachers
  const groupedSlots = availableSlots.reduce((groups, slot) => {
    const timeKey = `${slot.clientTimeDisplay}`;
    if (!groups[timeKey]) {
      groups[timeKey] = {
        clientTimeDisplay: slot.clientTimeDisplay,
        egyptTimeDisplay: slot.egyptTimeDisplay,
        utcStartTime: slot.utcStartTime,
        utcEndTime: slot.utcEndTime,
        teachers: [],
        count: 0
      };
    }
    groups[timeKey].teachers.push(slot);
    groups[timeKey].count++;
    return groups;
  }, {} as Record<string, any>);

  const groupedSlotsList = Object.values(groupedSlots);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-primary">Sales Command Center</h2>
        <Badge variant="outline" className="text-xs">
          Sales Agent Dashboard
        </Badge>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filter by Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'today', label: 'Today' },
                { value: 'yesterday', label: 'Yesterday' },
                { value: 'last7days', label: 'Last 7 Days' },
                { value: 'thismonth', label: 'This Month' },
                { value: 'lastmonth', label: 'Last Month' },
                { value: 'alltime', label: 'All Time' },
                { value: 'custom', label: 'Custom Range' }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={dateFilter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            
            {dateFilter === 'custom' && (
              <div className="mt-4">
                <DatePickerWithRange
                  dateRange={customDateRange}
                  setDateRange={setCustomDateRange}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Booked Trials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{salesStats.bookedTrials.total}</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Individual: {salesStats.bookedTrials.individual}</div>
              <div>Family: {salesStats.bookedTrials.family}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Trials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{salesStats.completedTrials}</div>
            <p className="text-xs text-muted-foreground">Ready for conversion</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-up</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{salesStats.pendingFollowup}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{salesStats.conversions.count}</div>
            <p className="text-xs text-muted-foreground">{salesStats.conversions.percentage}% conversion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Availability Checker */}
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
                onSelect={setSelectedDate}
                className="rounded-md border"
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
              
              {!loading && groupedSlotsList.length === 0 && (
                <div className="text-center py-8 text-muted-foreground space-y-2">
                  <p>No available slots found for {selectedDate?.toDateString()}.</p>
                  <p className="text-sm">Try selecting a different date or time.</p>
                </div>
              )}
              
              <div className="space-y-2">
                {groupedSlotsList.map((group, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div className="space-y-1">
                      <div className="font-medium text-primary">
                        {group.clientTimeDisplay}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {group.egyptTimeDisplay}
                      </div>
                      <div className="text-xs text-green-600">
                        {group.count} teacher{group.count > 1 ? 's' : ''} available
                      </div>
                      <div className="text-xs text-muted-foreground">
                        UTC: {group.utcStartTime} - {group.utcEndTime}
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      className="ayat-button-primary"
                      onClick={() => handleBookNow(group.teachers[0])}
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

export default SalesHomepage;
