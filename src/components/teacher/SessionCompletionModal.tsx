
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useSessionCompletion } from '@/hooks/useSessionCompletion';
import { Clock, FileText, CheckCircle } from 'lucide-react';

interface SessionCompletionModalProps {
  session: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({
  session,
  open,
  onClose,
  onSuccess
}) => {
  const { completeSession, loading } = useSessionCompletion();
  const [actualMinutes, setActualMinutes] = useState(60);
  const [learningNotes, setLearningNotes] = useState('');
  const [attendanceConfirmed, setAttendanceConfirmed] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!learningNotes.trim()) {
      alert('Please add learning notes for this session');
      return;
    }

    const result = await completeSession(session.id, actualMinutes, learningNotes, attendanceConfirmed);
    if (result) {
      onSuccess();
      // Reset form
      setActualMinutes(60);
      setLearningNotes('');
      setAttendanceConfirmed(true);
    }
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Complete Session
          </DialogTitle>
          <DialogDescription>
            Mark this session as completed and add learning details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="actual-minutes" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Actual Minutes Taught
            </Label>
            <Input
              id="actual-minutes"
              type="number"
              min="10"
              max="90"
              value={actualMinutes}
              onChange={(e) => setActualMinutes(parseInt(e.target.value))}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the actual time spent teaching (10-90 minutes)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="learning-notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Learning Notes
            </Label>
            <Textarea
              id="learning-notes"
              placeholder="What did the student learn? Any homework assigned? Progress notes..."
              value={learningNotes}
              onChange={(e) => setLearningNotes(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="attendance"
              checked={attendanceConfirmed}
              onCheckedChange={(checked) => setAttendanceConfirmed(!!checked)}
            />
            <Label htmlFor="attendance" className="text-sm">
              Student attended the session
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="ayat-button-primary"
              disabled={loading}
            >
              {loading ? 'Completing...' : 'Complete Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
