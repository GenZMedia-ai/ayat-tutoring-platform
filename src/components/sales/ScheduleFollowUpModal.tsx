
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { formatInEgyptTime } from '@/utils/egyptTimezone';
import { useStudentFollowUp } from '@/hooks/useStudentFollowUp';
import { TrialSessionFlowStudent } from '@/types/trial';
import { FamilyGroup } from '@/types/family';

interface ScheduleFollowUpModalProps {
  student: TrialSessionFlowStudent | FamilyGroup;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScheduleFollowUpModal: React.FC<ScheduleFollowUpModalProps> = ({
  student,
  open,
  onClose,
  onSuccess
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const { scheduleFollowUp, loading } = useStudentFollowUp();

  const studentName = 'name' in student ? student.name : student.parent_name;
  const studentId = student.id;

  const handleSubmit = async () => {
    if (!selectedDate || !reason) {
      return;
    }

    try {
      // Combine date and time in Egypt timezone
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const egyptDateTime = new Date(selectedDate);
      egyptDateTime.setHours(hours, minutes, 0, 0);
      
      // Convert to UTC for storage (the database function expects UTC)
      const utcDateTime = new Date(egyptDateTime.getTime() - (2 * 60 * 60 * 1000)); // Egypt is UTC+2
      
      await scheduleFollowUp(studentId, utcDateTime, reason, notes);
      onSuccess();
      onClose();
      
      // Reset form
      setSelectedDate(undefined);
      setSelectedTime('09:00');
      setReason('');
      setNotes('');
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const timeOptions = [];
  for (let hour = 8; hour <= 22; hour++) {
    timeOptions.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 22) {
      timeOptions.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Follow-up for {studentName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Follow-up Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
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

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Follow-up Time (Egypt Time)</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label>Reason for Follow-up</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payment-delay">Customer will pay later</SelectItem>
                <SelectItem value="needs-consultation">Needs teacher consultation</SelectItem>
                <SelectItem value="questions">Has questions about program</SelectItem>
                <SelectItem value="price-negotiation">Discussing pricing</SelectItem>
                <SelectItem value="family-decision">Family decision pending</SelectItem>
                <SelectItem value="technical-issues">Technical setup help</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context or specific points to discuss..."
              rows={3}
            />
          </div>

          {/* Preview */}
          {selectedDate && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">
                Follow-up scheduled for:
              </p>
              <p className="text-sm text-blue-700">
                {format(selectedDate, 'EEEE, MMMM do, yyyy')} at {selectedTime} (Egypt Time)
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedDate || !reason || loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? 'Scheduling...' : 'Schedule Follow-up'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
