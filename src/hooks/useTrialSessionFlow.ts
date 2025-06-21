
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TrialSessionFlowStudent } from '@/types/trial';

export const useTrialSessionFlow = () => {
  const [students, setStudents] = useState<TrialSessionFlowStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTrialSessionData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Base query for students based on user role
      let studentsQuery = supabase
        .from('students')
        .select(`
          *,
          trial_outcomes:trial_outcomes(
            id,
            outcome,
            teacher_notes,
            student_behavior,
            recommended_package,
            submitted_by,
            submitted_at
          ),
          whatsapp_contacts:whatsapp_contacts(
            id,
            contacted_at,
            attempt_number,
            contact_type,
            success,
            notes
          ),
          payment_links:payment_links(
            id,
            currency,
            amount,
            expires_at,
            status,
            created_at
          ),
          sales_followups:sales_followups(
            id,
            scheduled_date,
            reason,
            completed,
            outcome,
            notes
          )
        `);

      // Filter based on user role
      if (user.role === 'teacher') {
        studentsQuery = studentsQuery.eq('assigned_teacher_id', user.id);
      } else if (user.role === 'sales') {
        studentsQuery = studentsQuery.eq('assigned_sales_agent_id', user.id);
      } else if (user.role === 'supervisor') {
        // Supervisors can see students assigned to teachers they supervise
        // For now, show all students - this can be refined based on supervisor assignment logic
      }

      const { data: studentsData, error: studentsError } = await studentsQuery
        .order('created_at', { ascending: false });

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }

      // Transform the data to include related entities
      const transformedStudents: TrialSessionFlowStudent[] = studentsData?.map(student => ({
        ...student,
        lastWhatsAppContact: student.whatsapp_contacts?.length > 0 
          ? student.whatsapp_contacts.sort((a: any, b: any) => 
              new Date(b.contacted_at).getTime() - new Date(a.contacted_at).getTime()
            )[0]
          : undefined,
        pendingFollowUp: student.sales_followups?.find((f: any) => !f.completed),
        trialOutcome: student.trial_outcomes?.length > 0 
          ? student.trial_outcomes[student.trial_outcomes.length - 1]
          : undefined,
        paymentLink: student.payment_links?.length > 0
          ? student.payment_links.sort((a: any, b: any) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]
          : undefined
      })) || [];

      setStudents(transformedStudents);
    } catch (error) {
      console.error('Error in fetchTrialSessionData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialSessionData();
  }, [user]);

  const refetchData = () => {
    fetchTrialSessionData();
  };

  // Get students by status for different dashboard sections
  const getStudentsByStatus = (status: string | string[]) => {
    const statusArray = Array.isArray(status) ? status : [status];
    return students.filter(student => statusArray.includes(student.status));
  };

  // Get students requiring WhatsApp contact (for teachers)
  const getStudentsRequiringContact = () => {
    return students.filter(student => 
      student.status === 'pending' && 
      !student.lastWhatsAppContact?.success
    );
  };

  // Get students requiring follow-up (for sales)
  const getStudentsRequiringFollowUp = () => {
    return students.filter(student => 
      student.status === 'trial-completed' && 
      !student.paymentLink &&
      !student.pendingFollowUp
    );
  };

  // Get students with pending follow-ups
  const getStudentsWithPendingFollowUps = () => {
    return students.filter(student => 
      student.pendingFollowUp && 
      !student.pendingFollowUp.completed
    );
  };

  // Get students awaiting payment
  const getStudentsAwaitingPayment = () => {
    return students.filter(student => 
      student.status === 'awaiting-payment' ||
      (student.paymentLink && student.paymentLink.status === 'pending')
    );
  };

  return {
    students,
    loading,
    refetchData,
    getStudentsByStatus,
    getStudentsRequiringContact,
    getStudentsRequiringFollowUp,
    getStudentsWithPendingFollowUps,
    getStudentsAwaitingPayment
  };
};
