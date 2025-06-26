
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { useEnhancedSalesAvailability, EnhancedBookingData } from '@/hooks/useEnhancedSalesAvailability';
import { TEACHER_TYPES } from '@/constants/teacherTypes';
import { HOURLY_TIME_SLOTS, TIMEZONES } from '@/constants/timeSlots';
import { BookingModal } from '@/components/booking/BookingModal';

interface QuickAvailabilityCheckerProps {
  onBookingSuccess?: () => void;
}

export const QuickAvailabilityChecker: React.FC<QuickAvailabilityCheckerProps> = ({
  onBookingSuccess
}) => {
  // FIXED: Use current date instead of hardcoded date
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timezone, setTimezone] = useState('saudi'); // FIXED: Default to Saudi Arabia
  const [teacherType, setTeacherType] = useState('mixed');
  const [selectedHour, setSelectedHour] = useState(14);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  const { loading, aggregatedSlots, checkAvailability, bookTrialSession } = useEnhancedSalesAvailability();

  const handleSearchAvailability = () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    checkAvailability(selectedDate, timezone, teacherType, selectedHour);
  };

  const handleBookNow = (slot: any, teacherId: string) => {
    setSelectedSlot(slot);
    setSelectedTeacherId(teacherId);
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (data: EnhancedBookingData, isMultiStudent: boolean) => {
    if (!selectedDate || !selectedSlot || !selectedTeacherId) return false;
    
    const success = await bookTrialSession(
      data,
      selectedDate,
      selectedSlot,
      selectedTeacherId,
      teacherType,
      isMultiStudent
    );
    
    if (success) {
      onBookingSuccess?.();
      setTimeout(() => {
        handleSearchAvailability();
      }, 1000);
    }
    
    return success;
  };

  return (
    <>
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Quick Availability Checker</CardTitle>
          <CardDescription>
            Search and book available trial session slots with enhanced teacher aggregation
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
                disabled={(date) => date < new Date()}
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
                  Available Slots for {selectedDate?.toDateString()}
                </h4>
                <div className="text-xs text-muted-foreground">
                  Today: {new Date().toDateString()}
                </div>
              </div>
              
              {loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Searching for available slots...
                </div>
              )}
              
              {!loading && aggregatedSlots.length === 0 && (
                <div className="text-center py-8 text-muted-foreground space-y-2">
                  <p>No available slots found.</p>
                  <p className="text-sm">Try selecting a different date or time.</p>
                </div>
              )}
              
              <div className="space-y-3">
                {aggregatedSlots.map((slot) => (
                  <div key={slot.id} className="border border-border rounded-lg bg-card">
                    <div className="p-4">
                      <div className="font-medium text-primary mb-2">
                        {slot.clientTimeDisplay}
                      </div>
                      <div className="space-y-2">
                        {slot.teachers.map((teacher) => (
                          <div key={teacher.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="text-sm">
                              <span className="font-medium">{teacher.name}</span>
                              <span className="text-muted-foreground ml-2">({teacher.type})</span>
                            </div>
                            <Button 
                              size="sm"
                              className="ayat-button-primary"
                              onClick={() => handleBookNow(slot, teacher.id)}
                            >
                              Book Now
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
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
        selectedSlot={selectedSlot ? selectedSlot.clientTimeDisplay : ''}
        selectedDate={selectedDate || new Date()}
      />
    </>
  );
};
