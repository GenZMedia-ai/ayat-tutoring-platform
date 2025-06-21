
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTrialOutcomes = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitTrialOutcome = async (
    studentId: string,
    sessionId: string,
    outcome: 'completed' | 'ghosted' | 'rescheduled',
    teacherNotes?: string,
    studentBehavior?: string,
    recommendedPackage?: string
  ) => {
    setIsSubmitting(true);
    
    try {
      console.log('Submitting trial outcome:', {
        studentId,
        sessionId,
        outcome,
        teacherNotes,
        studentBehavior,
        recommendedPackage
      });

      const { data, error } = await supabase.rpc('submit_trial_outcome', {
        p_student_id: studentId,
        p_session_id: sessionId,
        p_outcome: outcome,
        p_teacher_notes: teacherNotes,
        p_student_behavior: studentBehavior,
        p_recommended_package: recommendedPackage
      });

      if (error) {
        console.error('Error submitting trial outcome:', error);
        throw error;
      }

      console.log('Trial outcome submitted successfully:', data);

      toast({
        title: "Trial Outcome Submitted",
        description: `Trial marked as ${outcome}. Control returned to Sales team.`,
      });

      return data;
    } catch (error: any) {
      console.error('Failed to submit trial outcome:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit trial outcome",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitTrialOutcome,
    isSubmitting
  };
};
