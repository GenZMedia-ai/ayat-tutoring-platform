
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, User } from 'lucide-react';
import { useSessionCompletion } from '@/hooks/useSessionCompletion';
import { TodayPaidSession } from '@/hooks/useTodayPaidSessions';

interface SessionCompletionModalProps {
  session: TodayPaidSession;
  open: boolean;
  onClose: () => void;
}

export const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({
  session,
  open,
  onClose
}) => {
  const [actualMinutes, setActualMinutes] = useState<number>(30);
  const [learningNotes, setLearningNotes] = useState<string>('');
  const [attendanceConfirmed, setAttendanceConfirmed] = useState<boolean>(false);

  const completionMutation = useSessionCompletion();

  const handleSubmit = async () => {
    if (!learningNotes.trim() || learningNotes.length < 10) {
      alert('Please provide detailed learning notes (minimum 10 characters)');
      return;
    }

    if (!attendanceConfirmed) {
      alert('Please confirm student attendance');
      return;
    }

    if (actualMinutes < 10 || actualMinutes > 90) {
      alert('Actual minutes must be between 10 and 90');
      return;
    }

    try {
      await completionMutation.mutateAsync({
        sessionId: session.session_id,
        actualMinutes,
        learningNotes,
        attendanceConfirmed
      });
      onClose();
    } catch (error) {
      console.error('Session completion failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Complete Session - {session.student_name}
          </DialogTitle>
          <DialogDescription>
            Record the session completion details for session #{session.session_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="font-medium">{session.student_name}</p>
              <p className="text-sm text-muted-foreground">
                {session.student_unique_id} • Session {session.session_number} of {session.package_session_count}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {session.scheduled_time}
              </Badge>
              <Badge variant="outline">{session.platform}</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="actualMinutes">Actual Minutes Taught *</Label>
              <Input
                id="actualMinutes"
                type="number"
                min="10"
                max="90"
                value={actualMinutes}
                onChange={(e) => setActualMinutes(Number(e.target.value))}
                placeholder="e.g. 30"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the actual duration of the session (10-90 minutes)
              </p>
            </div>

            <div>
              <Label htmlFor="learningNotes">Learning Notes & Homework *</Label>
              <Textarea
                id="learningNotes"
                value={learningNotes}
                onChange={(e) => setLearningNotes(e.target.value)}
                placeholder="Describe what was covered in this session, student performance, homework assigned, and any important observations..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 10 characters required. Be specific about lesson content and homework.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="attendance"
                checked={attendanceConfirmed}
                onCheckedChange={(checked) => setAttendanceConfirmed(checked as boolean)}
              />
              <Label htmlFor="attendance" className="text-sm">
                I confirm the student attended and participated in this session *
              </Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={completionMutation.isPending}
              className="flex-1"
            >
              {completionMutation.isPending ? 'Completing...' : 'Complete Session'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
