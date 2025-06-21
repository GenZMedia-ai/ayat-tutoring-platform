
import React, { useState } from 'react';
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
  const [loading, setLoading] = useState(false);

  // Mock available time slots - in real implementation, this would come from teacher availability
  const availableTimeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const handleReschedule = async () => {
    if (!rescheduleReason || !selectedDate || !selectedTimeSlot) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // In real implementation, this would call a reschedule API
      console.log('Rescheduling:', {
        studentId: student?.id,
        reason: rescheduleReason,
        newDate: selectedDate,
        newTime: selectedTimeSlot
      });

      toast.success('Trial session rescheduled successfully');
      onSuccess();
    } catch (error) {
      console.error('Error rescheduling:', error);
      toast.error('Failed to reschedule trial session');
    } finally {
      setLoading(false);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Trial Session</DialogTitle>
          <DialogDescription>
            Reschedule the trial session for {student.name} ({student.uniqueId})
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
              <div className="grid grid-cols-4 gap-2">
                {availableTimeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTimeSlot === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeSlot(time)}
                    className="text-sm"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleReschedule} 
            disabled={loading || !rescheduleReason || !selectedDate || !selectedTimeSlot}
          >
            {loading ? 'Rescheduling...' : 'Reschedule Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
