
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { useStudentFollowUp, FollowUpData } from '@/hooks/useStudentFollowUp';
import { TrialSessionFlowStudent } from '@/types/trial';
import { FamilyGroup } from '@/types/family';

interface CompleteFollowUpModalProps {
  student: TrialSessionFlowStudent | FamilyGroup;
  followUpData: FollowUpData;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CompleteFollowUpModal: React.FC<CompleteFollowUpModalProps> = ({
  student,
  followUpData,
  open,
  onClose,
  onSuccess
}) => {
  const [outcome, setOutcome] = useState<'awaiting-payment' | 'paid' | 'dropped'>('awaiting-payment');
  const [notes, setNotes] = useState('');
  const { completeFollowUp, loading } = useStudentFollowUp();

  const studentName = 'name' in student ? student.name : student.parent_name;

  const handleSubmit = async () => {
    try {
      await completeFollowUp(followUpData.id, outcome, notes);
      onSuccess();
      onClose();
      
      // Reset form
      setOutcome('awaiting-payment');
      setNotes('');
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const outcomeOptions = [
    {
      value: 'awaiting-payment' as const,
      label: 'Ready for Payment',
      description: 'Customer is ready to proceed with payment',
      icon: CreditCard,
      color: 'text-blue-600'
    },
    {
      value: 'paid' as const,
      label: 'Already Paid',
      description: 'Customer has completed payment',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      value: 'dropped' as const,
      label: 'Not Interested',
      description: 'Customer decided not to continue',
      icon: XCircle,
      color: 'text-red-600'
    }
  ];

  const selectedOutcomeOption = outcomeOptions.find(opt => opt.value === outcome);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Follow-up for {studentName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Follow-up Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">Follow-up Reason:</p>
            <p className="text-sm text-gray-600">{followUpData.reason.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            {followUpData.notes && (
              <>
                <p className="text-sm font-medium mt-2">Previous Notes:</p>
                <p className="text-sm text-gray-600">{followUpData.notes}</p>
              </>
            )}
          </div>

          {/* Outcome Selection */}
          <div className="space-y-2">
            <Label>Follow-up Outcome</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {outcomeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center">
                      <option.icon className={`mr-2 h-4 w-4 ${option.color}`} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOutcomeOption && (
              <p className="text-xs text-gray-500">{selectedOutcomeOption.description}</p>
            )}
          </div>
          
          {/* Completion Notes */}
          <div className="space-y-2">
            <Label>Follow-up Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What was discussed? Any next steps or important information..."
              rows={3}
            />
          </div>

          {/* Preview */}
          <div className={`p-3 rounded-lg border ${
            outcome === 'awaiting-payment' ? 'bg-blue-50 border-blue-200' :
            outcome === 'paid' ? 'bg-green-50 border-green-200' :
            'bg-red-50 border-red-200'
          }`}>
            <p className="text-sm font-medium">
              Student will be moved to: <span className="capitalize">{outcome.replace('-', ' ')}</span>
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className={
              outcome === 'awaiting-payment' ? 'bg-blue-600 hover:bg-blue-700' :
              outcome === 'paid' ? 'bg-green-600 hover:bg-green-700' :
              'bg-red-600 hover:bg-red-700'
            }
          >
            {loading ? 'Completing...' : 'Complete Follow-up'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
