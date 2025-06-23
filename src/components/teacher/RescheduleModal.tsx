
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { TrialStudent } from '@/hooks/useTeacherTrialSessions';
import { useStudentStatusManagement } from '@/hooks/useStudentStatusManagement';
import { useTeacherAvailability } from '@/hooks/useTeacherAvailability';
import { LoadingSpinner } from './LoadingSpinner';
import { format } from 'date-fns';
import { Lock } from 'lucide-react';

interface RescheduleModalProps {
  student: TrialStudent | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  student,
  open,
  onClose,
  onSuccess
}) => {
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const { rescheduleStudent, loading: rescheduleLoading } = useStudentStatusManagement();
  const { timeSlots, loading: availabilityLoading, refreshAvailability } = useTeacherAvailability(selectedDate);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setRescheduleReason('');
      setSelectedDate(undefined);
      setSelectedTimeSlot('');
    }
  }, [open]);

  // Refresh availability when date changes
  useEffect(() => {
    if (selectedDate) {
      refreshAvailability();
    }
  }, [selectedDate, refreshAvailability]);

  const handleReschedule = async () => {
    if (!rescheduleReason || !selectedDate || !selectedTimeSlot || !student) {
      toast.error('Please fill in all required fields');
      return;
    }

    console.log('🔄 Rescheduling student:', {
      studentId: student.id,
      reason: rescheduleReason,
      newDate: selectedDate,
      newTime: selectedTimeSlot,
      currentDate: student.trialDate,
      currentTime: student.trialTime
    });

    const success = await rescheduleStudent(
      student.id, 
      selectedDate, 
      selectedTimeSlot, 
      rescheduleReason,
      student.trialDate,
      student.trialTime
    );
    
    if (success) {
      onSuccess();
      resetForm();
    }
  };

  const resetForm = () => {
    setRescheduleReason('');
    setSelectedDate(undefined);
    setSelectedTimeSlot('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!student) return null;

  // Categorize time slots
  const availableTimeSlots = timeSlots.filter(slot => 
    slot.isAvailable && !slot.isBooked
  );
  
  const bookedTimeSlots = timeSlots.filter(slot => 
    slot.isBooked
  );

  const isFormValid = rescheduleReason && selectedDate && selectedTimeSlot;

  const renderTimeSlotButton = (slot: { time: string; isAvailable: boolean; isBooked: boolean; studentId?: string }, isBooked = false) => {
    const isCurrentStudentSlot = slot.studentId === student.id;
    const isSelected = selectedTimeSlot === slot.time;
    const isDisabled = isBooked && !isCurrentStudentSlot;

    return (
      <Button
        key={slot.time}
        variant={isSelected ? "default" : "outline"}
        size="sm"
        disabled={isDisabled}
        onClick={() => !isDisabled && setSelectedTimeSlot(slot.time)}
        className={`text-sm relative ${
          isDisabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
            : isCurrentStudentSlot 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : ''
        }`}
      >
        {isDisabled && <Lock className="h-3 w-3 mr-1" />}
        {slot.time}
        {isCurrentStudentSlot && (
          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            ✓
          </span>
        )}
      </Button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Trial Session</DialogTitle>
          <DialogDescription>
            Reschedule the trial session for {student.name} ({student.uniqueId})
            {student.trialDate && student.trialTime && (
              <span className="block mt-1 text-sm text-muted-foreground">
                Current appointment: {format(new Date(student.trialDate), 'PPP')} at {student.trialTime}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reschedule Reason */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Reason for Rescheduling</Label>
            <RadioGroup
              value={rescheduleReason}
              onValueChange={setRescheduleReason}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="trial-completed-by-teacher" id="teacher" />
                <Label htmlFor="teacher" className="text-sm">
                  Trial completed: by teacher - Teacher identified an issue and spoke with client to arrange new time
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="by-student-client" id="student" />
                <Label htmlFor="student" className="text-sm">
                  By student/client - Student requested the change
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select New Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          {/* Time Slot Selection */}
          {selectedDate && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Time Slots for {selectedDate.toDateString()}
              </Label>
              
              {availabilityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading available slots...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Available Slots */}
                  {availableTimeSlots.length > 0 && (
                    <div>
                      <Label className="text-xs text-green-700 font-medium">
                        ✅ Available Slots ({availableTimeSlots.length})
                      </Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {availableTimeSlots.map((slot) => renderTimeSlotButton(slot))}
                      </div>
                    </div>
                  )}

                  {/* Booked Slots */}
                  {bookedTimeSlots.length > 0 && (
                    <div>
                      <Label className="text-xs text-red-700 font-medium">
                        🔒 Booked Slots ({bookedTimeSlots.length})
                      </Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {bookedTimeSlots.map((slot) => renderTimeSlotButton(slot, true))}
                      </div>
                    </div>
                  )}

                  {/* No slots message */}
                  {availableTimeSlots.length === 0 && bookedTimeSlots.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No time slots found for this date.</p>
                      <p className="text-xs mt-1">Please select a different date or contact the teacher to add availability.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          {selectedDate && (availableTimeSlots.length > 0 || bookedTimeSlots.length > 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-800 font-medium mb-2">Legend:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>Available for booking</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                    <Lock className="h-2 w-2" />
                  </div>
                  <span>Booked (unavailable)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded"></div>
                  <span>Current student's slot</span>
                </div>
              </div>
              <p className="text-xs text-blue-800 mt-2">
                ℹ️ All times are displayed in Egypt timezone (UTC+2). The selected time will be automatically converted for database storage.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={rescheduleLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleReschedule} 
            disabled={rescheduleLoading || !isFormValid || availabilityLoading}
          >
            {rescheduleLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Rescheduling...
              </>
            ) : (
              'Reschedule Session'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
