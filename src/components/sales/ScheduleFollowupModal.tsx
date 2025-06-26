
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ScheduleFollowupModalProps {
  student: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScheduleFollowupModal: React.FC<ScheduleFollowupModalProps> = ({
  student,
  open,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const followUpReasons = [
    'trial_completion_follow_up',
    'payment_reminder',
    'package_discussion',
    'reschedule_request',
    'general_check_in',
    'conversion_opportunity',
    'custom'
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  const handleScheduleFollowup = async () => {
    if (!selectedDate || !selectedTime || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Authentication required');
        return;
      }

      // Combine date and time
      const scheduledDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const { data, error } = await supabase
        .from('sales_followups')
        .insert({
          student_id: student.id,
          sales_agent_id: user.id,
          reason: reason,
          notes: notes || null,
          scheduled_date: scheduledDateTime.toISOString(),
          completed: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error scheduling follow-up:', error);
        toast.error('Failed to schedule follow-up');
        return;
      }

      console.log('Follow-up scheduled successfully:', data);
      toast.success('Follow-up scheduled successfully');
      
      // Reset form
      setSelectedDate(undefined);
      setSelectedTime('');
      setReason('');
      setNotes('');
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      toast.error('Failed to schedule follow-up');
    } finally {
      setLoading(false);
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      'trial_completion_follow_up': 'Trial Completion Follow-up',
      'payment_reminder': 'Payment Reminder',
      'package_discussion': 'Package Discussion',
      'reschedule_request': 'Reschedule Request',
      'general_check_in': 'General Check-in',
      'conversion_opportunity': 'Conversion Opportunity',
      'custom': 'Custom Follow-up'
    };
    return labels[reason] || reason;
  };

  const studentName = student.name || student.parent_name || 'Unknown';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Follow-up</DialogTitle>
          <DialogDescription>
            Schedule a follow-up reminder for {studentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Follow-up Reason *</Label>
            <Select value={reason} onValueChange={setReason} required>
              <SelectTrigger>
                <SelectValue placeholder="Select reason for follow-up" />
              </SelectTrigger>
              <SelectContent>
                {followUpReasons.map((reasonOption) => (
                  <SelectItem key={reasonOption} value={reasonOption}>
                    {getReasonLabel(reasonOption)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Follow-up Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Follow-up Time *</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime} required>
              <SelectTrigger>
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes for this follow-up..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleScheduleFollowup}
              className="flex-1"
              disabled={loading || !selectedDate || !selectedTime || !reason}
            >
              {loading ? 'Scheduling...' : 'Schedule Follow-up'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
