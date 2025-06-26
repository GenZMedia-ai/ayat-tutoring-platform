
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useTeacherAvailability } from '@/hooks/useTeacherAvailability';
import { Trash2, Lock, Calendar as CalendarIcon } from 'lucide-react';

const TeacherAvailability: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { timeSlots, loading, toggleAvailability } = useTeacherAvailability(selectedDate);

  const renderTimeSlotButton = (slot: { time: string; isAvailable: boolean; isBooked: boolean }) => {
    if (slot.isBooked) {
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
      return (
        <Button
          key={slot.time}
          size="sm"
          className="ayat-button-primary relative group"
          onClick={() => toggleAvailability(slot.time)}
          disabled={loading}
        >
          <Trash2 className="w-3 h-3 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          {slot.time}
        </Button>
      );
    }

    return (
      <Button
        key={slot.time}
        size="sm"
        variant="outline"
        onClick={() => toggleAvailability(slot.time)}
        disabled={loading}
      >
        {slot.time}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-primary">Availability Management</h2>
          <p className="text-muted-foreground">
            Set your available time slots for new bookings (Egypt time)
          </p>
        </div>
      </div>

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Schedule Your Availability</CardTitle>
          <CardDescription>
            Select dates and times when you're available for sessions. You can now modify any date including today.
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
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">
                Time Slots for {selectedDate?.toDateString()}
              </h4>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading availability...</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Click to toggle availability. Hover over available slots to remove them.
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
                        <span>Available (hover to remove)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-gray-300 rounded"></div>
                        <span>Not available (click to add)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-black rounded relative">
                          <Lock className="w-2 h-2 text-red-500 absolute top-0.5 right-0.5" />
                        </div>
                        <span>Booked (locked)</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherAvailability;
