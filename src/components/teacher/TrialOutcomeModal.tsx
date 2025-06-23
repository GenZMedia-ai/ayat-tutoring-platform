
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TrialOutcomeForm from './TrialOutcomeForm';
import { TrialStudent } from '@/hooks/useTeacherTrialSessions';
import { TeacherMixedTrialItem, TeacherTrialStudent, TeacherTrialFamily } from '@/hooks/useTeacherMixedTrialData';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from './LoadingSpinner';
import { useTrialOutcomes } from '@/hooks/useTrialOutcomes';

interface TrialOutcomeModalProps {
  student: TrialStudent | null;
  studentData?: TeacherMixedTrialItem;
  outcome: 'completed' | 'ghosted';
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TrialOutcomeModal: React.FC<TrialOutcomeModalProps> = ({
  student,
  studentData,
  outcome,
  open,
  onClose,
  onSuccess
}) => {
  const [actualStudent, setActualStudent] = useState<TrialStudent | null>(student);
  const [loading, setLoading] = useState(false);
  const { repairFamilySessionLinks } = useTrialOutcomes();

  // CRITICAL FIX: Create student object from mixed trial data when needed
  useEffect(() => {
    const createStudentFromData = async () => {
      if (!studentData || student) {
        setActualStudent(student);
        return;
      }

      console.log('🔧 CRITICAL FIX: Creating student object for trial outcome modal:', {
        type: studentData.type,
        id: studentData.id,
        hasSessionId: !!studentData.data.sessionId
      });

      setLoading(true);
      try {
        if (studentData.type === 'individual') {
          const individualData = studentData.data as TeacherTrialStudent;
          setActualStudent({
            id: individualData.id,
            name: individualData.name,
            age: individualData.age,
            phone: individualData.phone,
            country: individualData.country,
            trialDate: individualData.trialDate,
            trialTime: individualData.trialTime,
            uniqueId: individualData.uniqueId,
            parentName: individualData.parentName,
            notes: individualData.notes,
            status: individualData.status,
            sessionId: individualData.sessionId,
          });
        } else {
          // CRITICAL FIX: For family trials, fetch the first student ID from the family group
          const familyData = studentData.data as TeacherTrialFamily;
          
          console.log('🔍 CRITICAL FIX: Fetching first student from family group for trial outcome:', studentData.id);
          
          const { data: firstStudent, error } = await supabase
            .from('students')
            .select('id, name, age, phone, country, trial_date, trial_time, unique_id, parent_name, notes, status')
            .eq('family_group_id', studentData.id)
            .limit(1)
            .single();

          if (error || !firstStudent) {
            console.error('❌ CRITICAL FIX: Failed to fetch first student from family for trial outcome:', error);
            
            // Try to repair session links first
            console.log('🔧 Attempting to repair family session links...');
            try {
              await repairFamilySessionLinks();
              
              // Retry fetching the student
              const { data: retryStudent, error: retryError } = await supabase
                .from('students')
                .select('id, name, age, phone, country, trial_date, trial_time, unique_id, parent_name, notes, status')
                .eq('family_group_id', studentData.id)
                .limit(1)
                .single();
                
              if (retryError || !retryStudent) {
                toast.error('Failed to load family student data after repair attempt. Please refresh and try again.');
                onClose();
                return;
              }
              
              // Use repaired data
              setActualStudent({
                id: retryStudent.id,
                name: familyData.parentName,
                age: 0,
                phone: familyData.phone,
                country: familyData.country,
                trialDate: familyData.trialDate,
                trialTime: familyData.trialTime,
                uniqueId: familyData.uniqueId,
                parentName: familyData.parentName,
                notes: familyData.notes,
                status: familyData.status,
                sessionId: familyData.sessionId,
              });
            } catch (repairError) {
              console.error('❌ Failed to repair family session links:', repairError);
              toast.error('Failed to load family student data. Please refresh and try again.');
              onClose();
              return;
            }
          } else {
            console.log('✅ CRITICAL FIX: Successfully fetched first student from family for trial outcome:', {
              studentId: firstStudent.id,
              familyGroupId: studentData.id
            });

            setActualStudent({
              id: firstStudent.id, // CRITICAL FIX: Use actual student ID, not family group ID
              name: familyData.parentName,
              age: 0, // Not applicable for family
              phone: familyData.phone,
              country: familyData.country,
              trialDate: familyData.trialDate,
              trialTime: familyData.trialTime,
              uniqueId: familyData.uniqueId,
              parentName: familyData.parentName,
              notes: familyData.notes,
              status: familyData.status,
              sessionId: familyData.sessionId,
            });
          }
        }
      } catch (error) {
        console.error('❌ CRITICAL FIX: Error creating student object for trial outcome:', error);
        toast.error('Failed to prepare trial outcome data. Please try again.');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      createStudentFromData();
    }
  }, [open, student, studentData, onClose, repairFamilySessionLinks]);

  // PHASE 3 FIX: Enhanced session ID validation with family support
  useEffect(() => {
    if (open && actualStudent && !actualStudent.sessionId) {
      console.warn('⚠️ PHASE 3: No session ID found for student:', {
        studentName: actualStudent.name,
        studentId: actualStudent.id,
        hasSessionId: !!actualStudent.sessionId
      });
      
      // PHASE 3 FIX: Better error messaging for missing session data
      toast.error('Session data not found. This may indicate a trial without proper session linking. Please refresh and try again.');
      onClose();
    }
  }, [open, actualStudent, onClose]);

  // PHASE 3 FIX: Don't render if no session ID (prevents flash of content)
  if (!actualStudent || !actualStudent.sessionId) {
    if (loading) {
      return (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="max-w-2xl">
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-muted-foreground">Loading trial data...</span>
            </div>
          </DialogContent>
        </Dialog>
      );
    }
    
    console.error('❌ PHASE 3: Cannot render TrialOutcomeModal without session ID:', {
      studentName: actualStudent?.name,
      studentId: actualStudent?.id
    });
    return null;
  }

  const handleSuccess = () => {
    console.log('✅ PHASE 3: Trial outcome submitted successfully for:', actualStudent.name);
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <TrialOutcomeForm
          student={actualStudent}
          sessionId={actualStudent.sessionId} // PHASE 3 FIX: Now guaranteed to exist
          initialOutcome={outcome}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TrialOutcomeModal;
