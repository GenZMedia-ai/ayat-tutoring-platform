
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { MixedStudentItem } from '@/hooks/useMixedStudentData';
import { TrialSessionFlowStudent } from '@/types/trial';
import { FamilyGroup } from '@/types/family';

interface ScheduleFollowupModalProps {
  open: boolean;
  onClose: () => void;
  item: MixedStudentItem;
  existingFollowup?: any;
  onSuccess: () => void;
}

const followUpReasons = [
  { value: 'trial_feedback', label: 'Trial Session Feedback' },
  { value: 'payment_reminder', label: 'Payment Reminder' },
  { value: 'package_discussion', label: 'Package Discussion' },
  { value: 'concern_resolution', label: 'Address Concerns' },
  { value: 'enrollment_assistance', label: 'Enrollment Assistance' },
  { value: 'custom', label: 'Custom Reason' }
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
];

export const ScheduleFollowupModal: React.FC<ScheduleFollowupModalProps> = ({
  open,
  onClose,
  item,
  existingFollowup,
  onSuccess
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const isFamily = item.type === 'family';
  const data = item.data;
  const studentName = isFamily ? (data as FamilyGroup).parent_name : (data as TrialSessionFlowStudent).name;

  useEffect(() => {
    if (existingFollowup) {
      setSelectedDate(new Date(existingFollowup.scheduled_date));
      setSelectedTime(existingFollowup.scheduled_time || '');
      setReason(existingFollowup.reason || '');
      setNotes(existingFollowup.notes || '');
    } else {
      // Reset form for new follow-up
      setSelectedDate(undefined);
      setSelectedTime('');
      setReason('');
      setNotes('');
    }
  }, [existingFollowup, open]);

  const handleSubmit = async () => {
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

      const followupData = {
        student_id: isFamily ? null : item.id,
        family_group_id: isFamily ? item.id : null,
        scheduled_date: selectedDate.toISOString().split('T')[0],
        scheduled_time: selectedTime,
        reason,
        notes,
        created_by: user.id
      };

      if (existingFollowup) {
        // Update existing follow-up
        const { error } = await supabase
          .from('sales_followups')
          .update({
            scheduled_date: followupData.scheduled_date,
            scheduled_time: followupData.scheduled_time,
            reason: followupData.reason,
            notes: followupData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingFollowup.id);

        if (error) throw error;
        toast.success('Follow-up rescheduled successfully');
      } else {
        // Create new follow-up
        const { error } = await supabase
          .from('sales_followups')
          .insert(followupData);

        if (error) throw error;
        toast.success('Follow-up scheduled successfully');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      toast.error('Failed to schedule follow-up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {existingFollowup ? 'Reschedule Follow-up' : 'Schedule Follow-up'}
          </DialogTitle>
          <DialogDescription>
            {existingFollowup ? 'Reschedule' : 'Schedule'} a follow-up contact for {studentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Follow-up Date *</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              disabled={(date) => date < new Date()}
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Follow-up Time *</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <Clock className="h-4 w-4 mr-2" />
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

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label>Follow-up Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {followUpReasons.map((reasonOption) => (
                  <SelectItem key={reasonOption.value} value={reasonOption.value}>
                    {reasonOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes for the follow-up..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={loading || !selectedDate || !selectedTime || !reason}
            >
              {loading ? 'Scheduling...' : existingFollowup ? 'Reschedule' : 'Schedule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
