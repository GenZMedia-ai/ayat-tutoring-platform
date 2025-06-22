
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { useStudentRegistration } from '@/hooks/useStudentRegistration';
import { PaidStudent } from '@/hooks/usePaidStudents';

interface RegistrationModalProps {
  student: PaidStudent;
  open: boolean;
  onClose: () => void;
}

interface SessionSlot {
  date: string;
  time: string;
  sessionNumber: number;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  student,
  open,
  onClose
}) => {
  const [sessionSlots, setSessionSlots] = useState<SessionSlot[]>(() =>
    Array.from({ length: student.package_session_count }, (_, i) => ({
      date: '',
      time: '',
      sessionNumber: i + 1
    }))
  );

  const registrationMutation = useStudentRegistration();

  const handleSlotChange = (index: number, field: 'date' | 'time', value: string) => {
    setSessionSlots(prev => prev.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    ));
  };

  const handleSubmit = async () => {
    // Validate all slots are filled
    const isValid = sessionSlots.every(slot => slot.date && slot.time);
    if (!isValid) {
      alert('Please fill in all session dates and times');
      return;
    }

    // Check for duplicates
    const slots = sessionSlots.map(slot => `${slot.date}-${slot.time}`);
    const uniqueSlots = new Set(slots);
    if (slots.length !== uniqueSlots.size) {
      alert('Please ensure all session times are unique');
      return;
    }

    try {
      await registrationMutation.mutateAsync({
        studentId: student.id,
        sessionSchedules: sessionSlots
      });
      onClose();
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Complete Registration - {student.name}
          </DialogTitle>
          <DialogDescription>
            Schedule all {student.package_session_count} sessions for this student's package.
            Make sure to coordinate with the student/parent before finalizing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">{student.name}</p>
              <p className="text-sm text-muted-foreground">{student.unique_id}</p>
            </div>
            <Badge variant="outline">
              {student.package_session_count} Sessions Package
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              All sessions must be scheduled. Coordinate with student/parent via WhatsApp first.
            </div>

            {sessionSlots.map((slot, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                <div className="col-span-3">
                  <Label className="text-sm font-medium">
                    Session {slot.sessionNumber}
                  </Label>
                </div>
                <div className="col-span-4">
                  <Label htmlFor={`date-${index}`} className="text-xs text-muted-foreground">
                    Date
                  </Label>
                  <Input
                    id={`date-${index}`}
                    type="date"
                    value={slot.date}
                    onChange={(e) => handleSlotChange(index, 'date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="col-span-4">
                  <Label htmlFor={`time-${index}`} className="text-xs text-muted-foreground">
                    Time
                  </Label>
                  <Input
                    id={`time-${index}`}
                    type="time"
                    value={slot.time}
                    onChange={(e) => handleSlotChange(index, 'time', e.target.value)}
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={registrationMutation.isPending}
              className="flex-1"
            >
              {registrationMutation.isPending ? 'Registering...' : 'Complete Registration'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
