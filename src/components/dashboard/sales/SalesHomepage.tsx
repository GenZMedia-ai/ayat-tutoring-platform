import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { toast } from 'sonner';
import { useSimpleSalesAvailability, SimpleBookingData } from '@/hooks/useSimpleSalesAvailability';
import { TEACHER_TYPES } from '@/constants/teacherTypes';
import { HOURLY_TIME_SLOTS, TIMEZONES } from '@/constants/timeSlots';
import { BookingModal } from '@/components/booking/BookingModal';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
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
    <div className="space-y-6 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sales-heading-1">Sales Command Center</h1>
          <p className="sales-body">Manage trials, follow-ups, and conversions</p>
        </div>
        <Badge variant="outline" className="sales-badge sales-badge-info">
          Sales Agent Dashboard
        </Badge>
      </div>

      {/* Date Filter */}
      <div className="sales-card">
        <div className="mb-4">
          <h3 className="sales-heading-4 mb-3">Filter by Date</h3>
        </div>
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
                className={dateFilter === option.value ? "sales-btn-primary" : "sales-btn-ghost"}
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="sales-stat-card">
          <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full"></div>
          <div className="sales-stat-number">{salesStats.bookedTrials.total}</div>
          <div className="sales-stat-label">Booked Trials</div>
          <div className="text-xs text-muted-foreground space-y-1 mt-2">
            <div>Individual: {salesStats.bookedTrials.individual}</div>
            <div>Family: {salesStats.bookedTrials.family}</div>
          </div>
        </div>

        <div className="sales-stat-card">
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full" style={{backgroundColor: 'hsl(var(--status-success-text))'}}></div>
          <div className="sales-stat-number" style={{color: 'hsl(var(--status-success-text))'}}>{salesStats.completedTrials}</div>
          <div className="sales-stat-label">Completed Trials</div>
          <p className="text-xs text-muted-foreground mt-2">Ready for conversion</p>
        </div>

        <div className="sales-stat-card">
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full" style={{backgroundColor: 'hsl(var(--status-warning-text))'}}></div>
          <div className="sales-stat-number" style={{color: 'hsl(var(--status-warning-text))'}}>{salesStats.pendingFollowup}</div>
          <div className="sales-stat-label">Pending Follow-up</div>
          <p className="text-xs text-muted-foreground mt-2">Need attention</p>
        </div>

        <div className="sales-stat-card">
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full" style={{backgroundColor: 'hsl(var(--status-pending-text))'}}></div>
          <div className="sales-stat-number" style={{color: 'hsl(var(--status-pending-text))'}}>{salesStats.conversions.count}</div>
          <div className="sales-stat-label">Conversions</div>
          <p className="text-xs text-muted-foreground mt-2">{salesStats.conversions.percentage}% conversion rate</p>
        </div>
      </div>

      {/* Quick Availability Checker */}
      <div className="sales-card">
        <div className="mb-6">
          <h3 className="sales-heading-3">Quick Availability Checker</h3>
          <p className="sales-body">
            Search and book available trial session slots for both individual and family bookings
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="sales-label">Teacher Type</Label>
                <Select value={teacherType} onValueChange={setTeacherType}>
                  <SelectTrigger className="sales-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border rounded-lg shadow-lg">
                    {TEACHER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="hover:bg-muted">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="sales-label">Client Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="sales-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border rounded-lg shadow-lg">
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value} className="hover:bg-muted">
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="sales-label">Preferred Time (Hour)</Label>
              <Select value={selectedHour.toString()} onValueChange={(value) => setSelectedHour(parseFloat(value))}>
                <SelectTrigger className="sales-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border rounded-lg shadow-lg">
                  {HOURLY_TIME_SLOTS.map((timeSlot) => (
                    <SelectItem key={timeSlot.value} value={timeSlot.value.toString()} className="hover:bg-muted">
                      {timeSlot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sales-calendar">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="pointer-events-auto"
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </div>

            <Button 
              onClick={handleSearchAvailability}
              className="w-full sales-btn-primary"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search Available Slots'}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="sales-heading-4">
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
              <div className="sales-empty-state">
                <p className="sales-heading-4 text-muted-foreground mb-2">No available slots found for {selectedDate?.toDateString()}.</p>
                <p className="sales-body">Try selecting a different date or time.</p>
              </div>
            )}
            
            <div className="space-y-3">
              {groupedSlotsList.map((group, index) => (
                <div key={index} className="sales-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="sales-heading-4 text-primary">
                        {group.clientTimeDisplay}
                      </div>
                      <div className="sales-body">
                        {group.egyptTimeDisplay}
                      </div>
                      <div className="text-xs" style={{color: 'hsl(var(--status-success-text))'}}>
                        {group.count} teacher{group.count > 1 ? 's' : ''} available
                      </div>
                      <div className="text-xs text-muted-foreground">
                        UTC: {group.utcStartTime} - {group.utcEndTime}
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      className="sales-btn-primary"
                      onClick={() => handleBookNow(group.teachers[0])}
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
