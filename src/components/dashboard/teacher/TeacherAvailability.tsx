
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useTeacherAvailability } from '@/hooks/useTeacherAvailability';
import { useServerDate } from '@/hooks/useServerDate';
import { Trash2, Lock } from 'lucide-react';

const TeacherAvailability: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { timeSlots, loading, toggleAvailability } = useTeacherAvailability(selectedDate);
  const { isDateToday, loading: dateLoading } = useServerDate();
  
  const isSelectedDateToday = isDateToday(selectedDate);

  const renderTimeSlotButton = (slot: { time: string; isAvailable: boolean; isBooked: boolean }) => {
    const isDisabled = loading || dateLoading;

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
          disabled={isDisabled}
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
        disabled={isDisabled}
      >
        {slot.time}
      </Button>
    );
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Availability Management</CardTitle>
        <CardDescription>
          Set your available time slots for new bookings (times shown in Egypt time)
          {isSelectedDateToday && (
            <span className="block text-green-600 font-medium mt-1">
              ✅ You can now manage today's availability including adding new slots
            </span>
          )}
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
              disabled={(date) => {
                // Allow today and future dates, prevent past dates only
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return date < yesterday;
              }}
            />
            {isSelectedDateToday && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Today's Availability Unlocked:</strong> You can now manage today's schedule including adding new time slots. Only booked slots remain protected to prevent disruption of confirmed bookings.
                </p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h4 className="font-medium">
              Time Slots for {selectedDate?.toDateString()}
            </h4>
            {loading || dateLoading ? (
              <p className="text-sm text-muted-foreground">Loading availability...</p>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Times displayed in 12-hour format (Egypt timezone). Click to toggle availability.
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
                      <span>Booked (protected)</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherAvailability;
