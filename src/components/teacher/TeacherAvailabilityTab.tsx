
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { useTeacherAvailability } from '@/hooks/useTeacherAvailability';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export const TeacherAvailabilityTab: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { timeSlots, loading, toggleAvailability } = useTeacherAvailability(selectedDate);

  const availableSlots = timeSlots.filter(slot => slot.isAvailable && !slot.isBooked);
  const bookedSlots = timeSlots.filter(slot => slot.isBooked);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-primary">Availability Management</h3>
          <p className="text-muted-foreground">
            Set your weekly availability and manage time slots
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          Teacher: {user?.full_name}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date
            </CardTitle>
            <CardDescription>
              Choose a date to manage availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              disabled={(date) => date < new Date()}
            />
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Slots
              {selectedDate && (
                <span className="text-base font-normal text-muted-foreground">
                  - {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Click on time slots to toggle availability (Egypt time)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading time slots...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.time}
                    variant={
                      slot.isBooked 
                        ? "destructive" 
                        : slot.isAvailable 
                          ? "default" 
                          : "outline"
                    }
                    size="sm"
                    className="h-12"
                    onClick={() => toggleAvailability(slot.time)}
                    disabled={slot.isBooked}
                  >
                    <div className="text-center">
                      <div className="font-medium">{slot.time}</div>
                      <div className="text-xs opacity-75">
                        {slot.isBooked 
                          ? "Booked" 
                          : slot.isAvailable 
                            ? "Available" 
                            : "Unavailable"
                        }
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Slots</CardTitle>
            <CardDescription>Open time slots for booking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {availableSlots.length}
            </div>
            <p className="text-sm text-muted-foreground">
              Available for {selectedDate ? format(selectedDate, 'MMM d') : 'selected date'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Booked Slots</CardTitle>
            <CardDescription>Confirmed appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {bookedSlots.length}
            </div>
            <p className="text-sm text-muted-foreground">
              Booked for {selectedDate ? format(selectedDate, 'MMM d') : 'selected date'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
