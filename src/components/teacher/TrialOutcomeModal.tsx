
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TrialOutcomeForm from './TrialOutcomeForm';
import { TrialStudent } from '@/hooks/useTeacherTrialSessions';
import { toast } from 'sonner';

interface TrialOutcomeModalProps {
  student: TrialStudent | null;
  outcome: 'completed' | 'ghosted';
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TrialOutcomeModal: React.FC<TrialOutcomeModalProps> = ({
  student,
  outcome,
  open,
  onClose,
  onSuccess
}) => {
  if (!student) return null;

  // Validate that we have a session ID
  if (!student.sessionId) {
    console.error('❌ No session ID found for student:', student.name);
    
    // Show error and close modal
    React.useEffect(() => {
      if (open && !student.sessionId) {
        toast.error('Session data not found. Please refresh and try again.');
        onClose();
      }
    }, [open, student.sessionId, onClose]);
    
    return null;
  }

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <TrialOutcomeForm
          student={student}
          sessionId={student.sessionId} // Use the real session ID
          initialOutcome={outcome}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TrialOutcomeModal;
