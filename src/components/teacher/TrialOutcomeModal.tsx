
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

  // PHASE 3 FIX: Enhanced session ID validation with family support
  React.useEffect(() => {
    if (open && !student.sessionId) {
      console.warn('⚠️ PHASE 3: No session ID found for student:', {
        studentName: student.name,
        studentId: student.id,
        hasSessionId: !!student.sessionId
      });
      
      // PHASE 3 FIX: Better error messaging for missing session data
      toast.error('Session data not found. This may indicate a family trial without proper session linking. Please refresh and try again.');
      onClose();
    }
  }, [open, student.sessionId, student.name, student.id, onClose]);

  // PHASE 3 FIX: Don't render if no session ID (prevents flash of content)
  if (!student.sessionId) {
    console.error('❌ PHASE 3: Cannot render TrialOutcomeModal without session ID:', {
      studentName: student.name,
      studentId: student.id
    });
    return null;
  }

  const handleSuccess = () => {
    console.log('✅ PHASE 3: Trial outcome submitted successfully for:', student.name);
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <TrialOutcomeForm
          student={student}
          sessionId={student.sessionId} // PHASE 3 FIX: Now guaranteed to exist
          initialOutcome={outcome}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TrialOutcomeModal;
