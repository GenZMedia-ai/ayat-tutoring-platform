
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
import { TEACHER_TYPES } from '@/constants/teacherTypes';
import { HOURLY_TIME_SLOTS, TIMEZONES } from '@/constants/timeSlots';
import { BookingModal } from '@/components/booking/BookingModal';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { TrendingUp, Users, Calendar as CalendarIcon, DollarSign, Search, Clock } from 'lucide-react';

const SalesHomepage: React.FC = () => {
  // Date filtering
  const [dateFilter, setDateFilter] = useState('today');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const utcDate = new Date(Date.UTC(2025, 5, 22));
    return utcDate;
  });
  const [timezone, setTimezone] = useState('qatar');
  const [teacherType, setTeacherType] = useState('mixed');
  const [selectedHour, setSelectedHour] = useState(14);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

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
        return customDateRange || { from: now, to: now };
      default:
        return { from: now, to: now };
    }
  };

  useEffect(() => {
    const loadSalesStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { from, to } = getDateRange();
        const fromStr = format(from, 'yyyy-MM-dd');
        const toStr = format(to, 'yyyy-MM-dd');

        const { count: individualTrials } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .gte('created_at', fromStr)
          .lte('created_at', toStr + 'T23:59:59');

        const { count: familyTrials } = await supabase
          .from('family_groups')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .gte('created_at', fromStr)
          .lte('created_at', toStr + 'T23:59:59');

        const { count: completedTrials } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .eq('status', 'trial-completed')
          .gte('created_at', fromStr)
          .lte('created_at', toStr + 'T23:59:59');

        const { count: pendingFollowup } = await supabase
          .from('sales_followups')
          .select('*', { count: 'exact', head: true })
          .eq('sales_agent_id', user.id)
          .eq('completed', false)
          .gte('created_at', fromStr)
          .lte('created_at', toStr + 'T23:59:59');

        const { count: paidStudents } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_sales_agent_id', user.id)
          .eq('status', 'paid')
          .gte('created_at', fromStr)
          .lte('created_at', toStr + 'T23:59:59');

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-stone-900">Sales Command Center</h2>
          <p className="text-stone-600 mt-1">Manage your sales pipeline and book appointments</p>
        </div>
        <Badge variant="outline" className="modern-badge bg-stone-100/80 text-stone-700 border-stone-200/60">
          Sales Agent Dashboard
        </Badge>
      </div>

      {/* Modern Date Filter */}
      <Card className="modern-card">
        <CardHeader className="modern-card-header">
          <CardTitle className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <div className="modern-icon-circle">
              <CalendarIcon className="w-4 h-4 text-stone-600" />
            </div>
            Filter by Date
          </CardTitle>
        </CardHeader>
        <CardContent className="modern-card-content">
          <div className="flex flex-wrap gap-3">
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
                className={dateFilter === option.value ? "modern-button-primary" : "modern-button-secondary"}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modern Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="modern-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-600">Booked Trials</p>
              <div className="text-3xl font-bold text-stone-900 mt-2">{salesStats.bookedTrials.total}</div>
              <div className="text-xs text-stone-500 space-y-1 mt-2">
                <div>Individual: {salesStats.bookedTrials.individual}</div>
                <div>Family: {salesStats.bookedTrials.family}</div>
              </div>
            </div>
            <div className="modern-icon-circle bg-blue-50 border-blue-200/40">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="modern-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-600">Completed Trials</p>
              <div className="text-3xl font-bold text-emerald-600 mt-2">{salesStats.completedTrials}</div>
              <p className="text-xs text-stone-500 mt-2">Ready for conversion</p>
            </div>
            <div className="modern-icon-circle bg-emerald-50 border-emerald-200/40">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="modern-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-600">Pending Follow-up</p>
              <div className="text-3xl font-bold text-amber-600 mt-2">{salesStats.pendingFollowup}</div>
              <p className="text-xs text-stone-500 mt-2">Need attention</p>
            </div>
            <div className="modern-icon-circle bg-amber-50 border-amber-200/40">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="modern-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-600">Conversions</p>
              <div className="text-3xl font-bold text-purple-600 mt-2">{salesStats.conversions.count}</div>
              <p className="text-xs text-stone-500 mt-2">{salesStats.conversions.percentage}% conversion rate</p>
            </div>
            <div className="modern-icon-circle bg-purple-50 border-purple-200/40">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Quick Availability Checker */}
      <Card className="modern-card">
        <CardHeader className="modern-card-header">
          <CardTitle className="text-xl font-semibold text-stone-900 flex items-center gap-3">
            <div className="modern-icon-circle bg-stone-100 border-stone-200/40">
              <Search className="w-5 h-5 text-stone-600" />
            </div>
            Quick Availability Checker
          </CardTitle>
          <CardDescription className="text-stone-600">
            Search and book available trial session slots for both individual and family bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="modern-card-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-stone-700">Teacher Type</Label>
                  <Select value={teacherType} onValueChange={setTeacherType}>
                    <SelectTrigger className="modern-select">
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
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-stone-700">Client Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="modern-select">
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
              
              <div className="space-y-3">
                <Label className="text-sm font-medium text-stone-700">Preferred Time (Hour)</Label>
                <Select value={selectedHour.toString()} onValueChange={(value) => setSelectedHour(parseFloat(value))}>
                  <SelectTrigger className="modern-select">
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
                    const utcDate = new Date(Date.UTC(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate()
                    ));
                    setSelectedDate(utcDate);
                  }
                }}
                className="rounded-xl border border-stone-200/60 bg-white/80 backdrop-blur-sm"
                disabled={(date) => date < new Date('2025-06-21')}
              />

              <Button 
                onClick={handleSearchAvailability}
                className="w-full modern-button-primary flex items-center gap-2"
                disabled={loading}
              >
                <Search className="w-4 h-4" />
                {loading ? 'Searching...' : 'Search Available Slots'}
              </Button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-stone-900">
                  Available 30-Minute Slots for {selectedDate?.toDateString()}
                </h4>
                <div className="text-xs text-stone-500 bg-stone-100/60 px-3 py-1 rounded-full">
                  Date: {selectedDate?.toISOString().split('T')[0]}
                </div>
              </div>
              
              {loading && (
                <div className="text-center py-12 text-stone-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400 mx-auto mb-4"></div>
                  Searching for slots on {selectedDate?.toISOString().split('T')[0]}...
                </div>
              )}
              
              {!loading && availableSlots.length === 0 && (
                <div className="text-center py-12 text-stone-500 space-y-3">
                  <div className="modern-icon-circle mx-auto bg-stone-100 border-stone-200/40">
                    <CalendarIcon className="w-6 h-6 text-stone-400" />
                  </div>
                  <p className="font-medium">No available slots found for {selectedDate?.toDateString()}.</p>
                  <p className="text-sm">Try selecting a different date or time.</p>
                </div>
              )}
              
              <div className="space-y-3">
                {availableSlots.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between p-5 border border-stone-200/60 rounded-xl bg-white/80 backdrop-blur-sm hover:border-stone-300/80 transition-all duration-200">
                    <div className="space-y-2">
                      <div className="font-semibold text-stone-900">
                        {slot.clientTimeDisplay}
                      </div>
                      <div className="text-sm text-stone-600">
                        Teacher: {slot.teacherName}
                      </div>
                      <div className="text-xs text-stone-500">
                        {slot.egyptTimeDisplay}
                      </div>
                      <div className="text-xs text-emerald-600 bg-emerald-50/60 px-2 py-1 rounded-full inline-block">
                        UTC: {slot.utcStartTime} - {slot.utcEndTime}
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      className="modern-button-primary"
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
