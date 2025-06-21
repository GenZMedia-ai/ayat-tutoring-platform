
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TrialSessionFlowStudent } from '@/types/trial';
import { useSalesPermissions } from '@/hooks/useSalesPermissions';
import { Badge } from '@/components/ui/badge';

interface StatusChangeModalProps {
  student: TrialSessionFlowStudent;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  student,
  open,
  onClose,
  onSuccess
}) => {
  const permissions = useSalesPermissions(student.status);
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');

  // Define valid status transitions for sales agents
  const getValidTransitions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'trial-completed':
        return [
          { value: 'awaiting-payment', label: 'Awaiting Payment' },
          { value: 'trial-ghosted', label: 'Mark as Ghosted' }
        ];
      case 'trial-ghosted':
        return [
          { value: 'awaiting-payment', label: 'Awaiting Payment' },
          { value: 'trial-completed', label: 'Mark as Completed' }
        ];
      case 'awaiting-payment':
        return [
          { value: 'paid', label: 'Mark as Paid' },
          { value: 'trial-completed', label: 'Back to Trial Completed' },
          { value: 'expired', label: 'Mark as Expired' }
        ];
      case 'paid':
        return [
          { value: 'active', label: 'Activate Sessions' },
          { value: 'cancelled', label: 'Cancel' }
        ];
      case 'expired':
        return [
          { value: 'awaiting-payment', label: 'Create New Payment' },
          { value: 'cancelled', label: 'Cancel' }
        ];
      default:
        return [];
    }
  };

  const validTransitions = getValidTransitions(student.status);

  const handleStatusChange = async () => {
    if (!permissions.canChangeStatus || !newStatus) {
      toast.error('Invalid status change');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id);

      if (error) {
        console.error('Error updating student status:', error);
        toast.error('Failed to update student status');
        return;
      }

      // If there are notes, create a follow-up entry or log
      if (notes.trim()) {
        // This could be extended to create follow-up entries
        console.log('Status change notes:', notes);
      }

      toast.success(`Student status updated to ${newStatus}`);
      onSuccess();
    } catch (error) {
      console.error('Error updating student status:', error);
      toast.error('Failed to update student status');
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.canChangeStatus) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Change Status</DialogTitle>
            <DialogDescription>
              {permissions.statusMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (validTransitions.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Valid Status Changes</DialogTitle>
            <DialogDescription>
              There are no valid status changes available for this student at the moment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Change Student Status</DialogTitle>
          <DialogDescription>
            Update status for {student.name} ({student.uniqueId})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current Status:</span>
            <Badge className="bg-blue-100 text-blue-800 border-0">
              {student.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newStatus">New Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {validTransitions.map((transition) => (
                  <SelectItem key={transition.value} value={transition.value}>
                    {transition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this status change..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleStatusChange} 
            disabled={loading || !newStatus}
          >
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
