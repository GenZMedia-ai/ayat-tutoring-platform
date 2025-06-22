
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, 
  User, 
  CheckCircle, 
  Calendar,
  Timer,
  BookOpen
} from 'lucide-react';
import { TodayPaidSession } from '@/hooks/useTodayPaidSessions';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TodayPaidSessionCardProps {
  session: TodayPaidSession;
  onComplete: (sessionId: string, actualMinutes: number, notes: string) => Promise<void>;
}

export const TodayPaidSessionCard: React.FC<TodayPaidSessionCardProps> = ({
  session,
  onComplete
}) => {
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [actualMinutes, setActualMinutes] = useState(30);
  const [completionNotes, setCompletionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const formatTime = (timeString: string) => {
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return format(time, 'HH:mm');
    } catch {
      return timeString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 border-0">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-0">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgressInfo = () => {
    const percentage = session.package_session_count > 0 
      ? Math.round((session.completed_sessions / session.package_session_count) * 100)
      : 0;
    
    return {
      percentage,
      text: `${session.completed_sessions}/${session.package_session_count} Sessions`
    };
  };

  const handleCompleteSession = async () => {
    if (!completionNotes.trim()) {
      toast.error('Please add completion notes');
      return;
    }

    try {
      setLoading(true);
      await onComplete(session.session_id, actualMinutes, completionNotes);
      setCompletionModalOpen(false);
      setCompletionNotes('');
      setActualMinutes(30);
      toast.success('Session completed successfully!');
    } catch (error) {
      console.error('Session completion error:', error);
      toast.error('Failed to complete session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = getProgressInfo();

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">Session #{session.session_number}</h3>
                {getStatusBadge(session.status)}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{session.student_name}</span>
                </div>
                <span className="font-mono">{session.student_unique_id}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Session Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatTime(session.scheduled_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(session.scheduled_date), 'MMM dd, yyyy')}</span>
            </div>
          </div>

          {/* Progress Information */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Student Progress</span>
              <Badge variant="outline">{progress.percentage}%</Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{progress.text}</p>
          </div>

          {/* Completion Info */}
          {session.status === 'completed' && session.completed_at && (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Session Completed</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                <div>Completed: {format(new Date(session.completed_at), 'MMM dd, HH:mm')}</div>
                {session.actual_minutes && (
                  <div>Duration: {session.actual_minutes} minutes</div>
                )}
              </div>
              {session.notes && (
                <p className="text-sm text-green-600 mt-2">
                  Notes: {session.notes}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {session.status === 'scheduled' && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                onClick={() => setCompletionModalOpen(true)}
                className="flex-1"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Completion Modal */}
      <Dialog open={completionModalOpen} onOpenChange={setCompletionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Complete Session #{session.session_number}
            </DialogTitle>
            <DialogDescription>
              Mark this session as completed for {session.student_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actual-minutes">Actual Session Duration (minutes)</Label>
              <Input
                id="actual-minutes"
                type="number"
                value={actualMinutes}
                onChange={(e) => setActualMinutes(parseInt(e.target.value) || 0)}
                min={1}
                max={120}
                placeholder="30"
              />
              <p className="text-sm text-muted-foreground">
                How long was the actual session?
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="completion-notes">Session Notes</Label>
              <Textarea
                id="completion-notes"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="What did you cover in this session? Student's progress, behavior, areas for improvement..."
                rows={4}
                required
              />
              <p className="text-sm text-muted-foreground">
                Please provide details about the session content and student performance
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setCompletionModalOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCompleteSession}
                disabled={loading || !completionNotes.trim()}
                className="flex-1"
              >
                {loading ? 'Completing...' : 'Complete Session'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
