
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

  // Filter available time slots (not booked and available)
  const availableTimeSlots = timeSlots.filter(slot => 
    slot.isAvailable && !slot.isBooked
  );

  const isFormValid = rescheduleReason && selectedDate && selectedTimeSlot;

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
                Available Time Slots for {selectedDate.toDateString()}
              </Label>
              
              {availabilityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading available slots...</span>
                </div>
              ) : availableTimeSlots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No available time slots for this date.</p>
                  <p className="text-xs mt-1">Please select a different date or contact the teacher to add availability.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableTimeSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTimeSlot === slot.time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTimeSlot(slot.time)}
                      className="text-sm"
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Egypt Time Zone Notice */}
          {selectedDate && availableTimeSlots.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-800">
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
