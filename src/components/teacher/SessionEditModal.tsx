
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherAvailability } from '@/hooks/useTeacherAvailability';
import { cn } from '@/lib/utils';
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { timeSlots, refreshAvailability } = useTeacherAvailability(selectedDate);

  // Initialize form when session changes
  useEffect(() => {
    if (session && open) {
      setSelectedDate(new Date(session.date));
      // Extract time from the session (assuming it's in HH:MM format)
      const sessionTime = new Date(`2000-01-01T${session.date.split('T')[1] || '12:00:00'}`);
      setSelectedTime(format(sessionTime, 'HH:mm'));
    }
  }, [session, open]);

  const handleSave = async () => {
    if (!session || !selectedDate || !selectedTime || !user) {
      toast.error('Please select both date and time');
      return;
    }

    setLoading(true);
    try {
      // Find the session ID from the database
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id')
        .eq('session_number', session.sessionNumber)
        .eq('scheduled_date', session.date)
        .maybeSingle();

      if (sessionError || !sessionData) {
        toast.error('Session not found');
        return;
      }

      // Check if the new time slot is available
      const selectedTimeSlot = timeSlots.find(slot => slot.time === selectedTime);
      if (!selectedTimeSlot?.isAvailable) {
        toast.error('Selected time slot is not available');
        return;
      }

      // Update the session
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
          scheduled_time: `${selectedTime}:00`,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionData.id);

      if (updateError) {
        toast.error('Failed to update session');
        return;
      }

      // Update teacher availability - mark old slot as available, new slot as booked
      if (session.date !== format(selectedDate, 'yyyy-MM-dd') || 
          session.date.split('T')[1]?.substring(0, 5) !== selectedTime) {
        
        // Free up the old slot
        await supabase
          .from('teacher_availability')
          .update({ is_booked: false })
          .eq('teacher_id', user.id)
          .eq('date', session.date.split('T')[0])
          .eq('time_slot', `${session.date.split('T')[1]?.substring(0, 5) || '12:00'}:00`);

        // Book the new slot
        await supabase
          .from('teacher_availability')
          .update({ is_booked: true, student_id: studentId })
          .eq('teacher_id', user.id)
          .eq('date', format(selectedDate, 'yyyy-MM-dd'))
          .eq('time_slot', `${selectedTime}:00`);
      }

      toast.success('Session updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
    } finally {
      setLoading(false);
    }
  };

  const availableTimes = timeSlots.filter(slot => slot.isAvailable && !slot.isBooked);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Session for {studentName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Session</Label>
            <p className="text-sm text-muted-foreground">
              Session {session?.sessionNumber} - {session?.date ? format(new Date(session.date), 'PPP') : 'Unknown date'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">New Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime(''); // Reset time when date changes
                  }}
                  disabled={(date) => date < new Date() || date < new Date(Date.now() + 24 * 60 * 60 * 1000)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">New Time</Label>
            <select
              className="w-full p-2 border border-input rounded-md bg-background"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              disabled={!selectedDate}
            >
              <option value="">Select a time</option>
              {availableTimes.map((slot) => (
                <option key={slot.time} value={slot.time}>
                  {slot.time}
                </option>
              ))}
            </select>
            {selectedDate && availableTimes.length === 0 && (
              <p className="text-sm text-muted-foreground">No available time slots for this date</p>
            )}
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
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
