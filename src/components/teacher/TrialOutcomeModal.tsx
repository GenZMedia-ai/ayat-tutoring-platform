
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TrialOutcomeForm from './TrialOutcomeForm';
import { TrialStudent } from '@/hooks/useTeacherTrialSessions';

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

  // Create a mock session ID - in a real implementation, this should come from the session data
  const sessionId = `session_${student.id}_${student.trialDate}_${student.trialTime}`;

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <TrialOutcomeForm
          student={student}
          sessionId={sessionId}
          initialOutcome={outcome}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TrialOutcomeModal;
