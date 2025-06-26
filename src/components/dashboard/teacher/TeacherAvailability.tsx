
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useTeacherAvailability } from '@/hooks/useTeacherAvailability';
import { Trash2, Lock } from 'lucide-react';

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
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 relative group"
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
        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300"
      >
        {slot.time}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Availability Management</h1>
        <p className="text-muted-foreground">
          Set your available time slots for new bookings (times shown in Egypt time)
        </p>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            Schedule Your Availability
          </CardTitle>
          <CardDescription>
            Click on time slots to toggle availability. Available slots are highlighted in blue/purple.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Select Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-lg border shadow-sm bg-white"
                disabled={(date) => date < new Date()}
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-lg">
                Time Slots for {selectedDate?.toDateString()}
              </h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-muted-foreground">Loading availability...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Click to toggle availability. Hover over available slots to remove them.
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                      {timeSlots.map(renderTimeSlotButton)}
                    </div>
                  </div>
                  
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <CardContent className="pt-4">
                      <h4 className="text-sm font-semibold mb-3 text-gray-700">Legend:</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></div>
                          <span>Available (hover to remove)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border border-gray-300 rounded bg-white"></div>
                          <span>Not available (click to add)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-black rounded relative">
                            <Lock className="w-2 h-2 text-red-500 absolute top-0.5 right-0.5" />
                          </div>
                          <span>Booked (locked)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
