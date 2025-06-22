
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { PaidStudent } from '@/hooks/usePaidStudents';
import { toast } from 'sonner';

interface SessionSlot {
  session_number: number;
  scheduled_date: string;
  scheduled_time: string;
}

interface RegistrationModalProps {
  student: PaidStudent | null;
  open: boolean;
  onClose: () => void;
  onComplete: (studentId: string, sessions: SessionSlot[]) => Promise<void>;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  student,
  open,
  onClose,
  onComplete
}) => {
  const [sessions, setSessions] = useState<SessionSlot[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (student && open) {
      // Initialize sessions array based on package session count
      const initialSessions: SessionSlot[] = [];
      for (let i = 1; i <= student.package_session_count; i++) {
        initialSessions.push({
          session_number: i,
          scheduled_date: '',
          scheduled_time: ''
        });
      }
      setSessions(initialSessions);
    }
  }, [student, open]);

  const updateSession = (index: number, field: keyof SessionSlot, value: string) => {
    setSessions(prev => prev.map((session, i) => 
      i === index ? { ...session, [field]: value } : session
    ));
  };

  const validateSessions = () => {
    for (const session of sessions) {
      if (!session.scheduled_date || !session.scheduled_time) {
        toast.error(`Please fill all date and time fields for Session ${session.session_number}`);
        return false;
      }
      
      // Basic date validation
      const sessionDate = new Date(session.scheduled_date);
      if (sessionDate < new Date()) {
        toast.error(`Session ${session.session_number} cannot be scheduled in the past`);
        return false;
      }
    }
    
    // Check for duplicate session times
    const sessionTimes = sessions.map(s => `${s.scheduled_date} ${s.scheduled_time}`);
    const uniqueTimes = new Set(sessionTimes);
    if (sessionTimes.length !== uniqueTimes.size) {
      toast.error('Each session must have a unique date and time');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!student || !validateSessions()) return;
    
    try {
      setLoading(true);
      await onComplete(student.id, sessions);
      toast.success('Student registration completed successfully!');
      onClose();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Complete Registration for {student.name}
          </DialogTitle>
          <DialogDescription>
            Schedule all {student.package_session_count} sessions for the {student.package_session_count}-session package.
            Please coordinate with the student/parent via WhatsApp before setting these dates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Student Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {student.name}
              </div>
              <div>
                <span className="font-medium">ID:</span> {student.unique_id}
              </div>
              <div>
                <span className="font-medium">Package:</span> {student.package_session_count} Sessions
              </div>
              <div>
                <span className="font-medium">Phone:</span> {student.phone}
              </div>
            </div>
          </div>

          {/* Session Scheduling */}
          <div className="space-y-4">
            <h4 className="font-medium">Schedule All Sessions</h4>
            <div className="grid gap-4">
              {sessions.map((session, index) => (
                <div key={session.session_number} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                  <div className="flex items-center font-medium">
                    Session #{session.session_number}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`date-${index}`}>Date</Label>
                    <Input
                      id={`date-${index}`}
                      type="date"
                      value={session.scheduled_date}
                      onChange={(e) => updateSession(index, 'scheduled_date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`time-${index}`}>Time</Label>
                    <Input
                      id={`time-${index}`}
                      type="time"
                      value={session.scheduled_time}
                      onChange={(e) => updateSession(index, 'scheduled_time', e.target.value)}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Completing Registration...' : 'Complete Registration'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
