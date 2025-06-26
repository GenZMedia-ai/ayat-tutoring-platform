
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useTeacherAvailability } from '@/hooks/useTeacherAvailability';
import { useServerDate } from '@/hooks/useServerDate';
import { Trash2, Lock, Eye } from 'lucide-react';

const TeacherAvailability: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { timeSlots, loading, toggleAvailability } = useTeacherAvailability(selectedDate);
  const { isDateToday, loading: dateLoading } = useServerDate();
  
  const isSelectedDateToday = isDateToday(selectedDate);

  const renderTimeSlotButton = (slot: { time: string; isAvailable: boolean; isBooked: boolean }) => {
    const isDisabled = loading || dateLoading || (isSelectedDateToday && !slot.isBooked);

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
      if (isSelectedDateToday) {
        return (
          <Button
            key={slot.time}
            size="sm"
            disabled
            className="ayat-button-primary opacity-60 cursor-not-allowed relative"
          >
            <Eye className="w-3 h-3 absolute top-1 right-1 opacity-60" />
            {slot.time}
          </Button>
        );
      } else {
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
    }

    if (isSelectedDateToday) {
      return (
        <Button
          key={slot.time}
          size="sm"
          variant="outline"
          disabled
          className="opacity-60 cursor-not-allowed"
        >
          {slot.time}
        </Button>
      );
    } else {
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
    }
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Availability Management</CardTitle>
        <CardDescription>
          Set your available time slots for new bookings (times shown in Egypt time)
          {isSelectedDateToday && (
            <span className="block text-orange-600 font-medium mt-1">
              ⚠️ Today's schedule is locked - you can only view existing availability
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
              disabled={(date) => date < new Date()}
            />
            {isSelectedDateToday && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Today's Schedule Locked:</strong> You cannot modify today's availability to prevent disruption of confirmed bookings. You can view your current schedule and all future dates remain editable.
                </p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h4 className="font-medium">
              Time Slots for {selectedDate?.toDateString()}
              {isSelectedDateToday && (
                <span className="text-sm text-orange-600 ml-2">(View Only)</span>
              )}
            </h4>
            {loading || dateLoading ? (
              <p className="text-sm text-muted-foreground">Loading availability...</p>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {isSelectedDateToday 
                      ? 'Viewing today\'s schedule (no modifications allowed)'
                      : 'Click to toggle availability. Hover over available slots to remove them.'
                    }
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
                      <span>
                        {isSelectedDateToday ? 'Available (view only)' : 'Available (hover to remove)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-gray-300 rounded"></div>
                      <span>
                        {isSelectedDateToday ? 'Not available (view only)' : 'Not available (click to add)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-black rounded relative">
                        <Lock className="w-2 h-2 text-red-500 absolute top-0.5 right-0.5" />
                      </div>
                      <span>Booked (locked)</span>
                    </div>
                    {isSelectedDateToday && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-primary opacity-60 rounded relative">
                          <Eye className="w-2 h-2 absolute top-0.5 right-0.5" />
                        </div>
                        <span>Today's slots (read-only)</span>
                      </div>
                    )}
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
