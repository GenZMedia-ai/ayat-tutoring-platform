
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SessionHistory {
  sessionNumber: number;
  date: string;
  status: string;
  actualMinutes?: number;
  notes?: string;
  completedAt?: string;
  isTrialSession: boolean;
}

interface SessionEditModalProps {
  session: SessionHistory | null;
  studentName: string;
  studentId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SessionEditModal: React.FC<SessionEditModalProps> = ({
  session,
  studentName,
  studentId,
  open,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize form when session changes
  useEffect(() => {
    if (session && open) {
      // Parse the existing session date and time
      const sessionDate = new Date(session.date);
      setSelectedDate(format(sessionDate, 'yyyy-MM-dd'));
      setSelectedTime(format(sessionDate, 'HH:mm'));
    }
  }, [session, open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedDate('');
      setSelectedTime('');
    }
  }, [open]);

  const handleSave = async () => {
    if (!session || !selectedDate || !selectedTime || !user) {
      toast.error('Please select both date and time');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Rescheduling session:', {
        sessionNumber: session.sessionNumber,
        currentDate: session.date,
        newDate: selectedDate,
        newTime: selectedTime,
        studentId,
        studentName
      });

      // Find the session ID from the database
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id')
        .eq('session_number', session.sessionNumber)
        .maybeSingle();

      if (sessionError || !sessionData) {
        console.error('❌ Session not found:', sessionError);
        toast.error('Session not found');
        return;
      }

      console.log('📝 Updating session with ID:', sessionData.id);

      // Update the session with new date and time
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          scheduled_date: selectedDate,
          scheduled_time: `${selectedTime}:00`,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionData.id);

      if (updateError) {
        console.error('❌ Failed to update session:', updateError);
        toast.error('Failed to update session');
        return;
      }

      console.log('✅ Session rescheduled successfully');
      toast.success('Session rescheduled successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Error updating session:', error);
      toast.error('Failed to update session');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Session for {studentName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Session</Label>
            <p className="text-sm text-muted-foreground">
              Session {session?.sessionNumber} - {session?.date ? format(new Date(session.date), 'PPP p') : 'Unknown date'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">New Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">New Time (Egypt Time)</Label>
            <Input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              💡 This will reschedule the session to {selectedDate && selectedTime ? 
                `${format(new Date(`${selectedDate}T${selectedTime}`), 'PPP p')}` : 
                'the selected date and time'
              }
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !selectedDate || !selectedTime}
          >
            {loading ? 'Saving...' : 'Reschedule Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
