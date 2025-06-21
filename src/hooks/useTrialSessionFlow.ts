
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
        .select('*');

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

      if (!studentsData) {
        setStudents([]);
        return;
      }

      // Fetch related data separately to avoid relation errors
      const studentIds = studentsData.map(s => s.id);

      // Fetch trial outcomes
      const { data: trialOutcomes } = await supabase
        .from('trial_outcomes')
        .select('*')
        .in('student_id', studentIds);

      // Fetch whatsapp contacts
      const { data: whatsappContacts } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .in('student_id', studentIds)
        .order('contacted_at', { ascending: false });

      // Fetch payment links
      const { data: paymentLinks } = await supabase
        .from('payment_links')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch sales followups
      const { data: salesFollowups } = await supabase
        .from('sales_followups')
        .select('*')
        .in('student_id', studentIds);

      // Transform the data to include related entities
      const transformedStudents: TrialSessionFlowStudent[] = studentsData.map(student => {
        // Find last WhatsApp contact for this student
        const studentWhatsAppContacts = whatsappContacts?.filter(c => c.student_id === student.id) || [];
        const lastWhatsAppContact = studentWhatsAppContacts.length > 0 ? {
          id: studentWhatsAppContacts[0].id,
          studentId: studentWhatsAppContacts[0].student_id,
          contactedBy: studentWhatsAppContacts[0].contacted_by,
          contactedAt: studentWhatsAppContacts[0].contacted_at,
          attemptNumber: studentWhatsAppContacts[0].attempt_number,
          contactType: studentWhatsAppContacts[0].contact_type as 'trial_confirmation' | 'follow_up' | 'reminder',
          success: studentWhatsAppContacts[0].success,
          notes: studentWhatsAppContacts[0].notes || undefined,
          createdAt: studentWhatsAppContacts[0].created_at
        } : undefined;

        // Find pending follow-up for this student
        const studentFollowups = salesFollowups?.filter(f => f.student_id === student.id) || [];
        const pendingFollowUp = studentFollowups.find(f => !f.completed) ? {
          id: studentFollowups.find(f => !f.completed)!.id,
          studentId: studentFollowups.find(f => !f.completed)!.student_id,
          salesAgentId: studentFollowups.find(f => !f.completed)!.sales_agent_id,
          scheduledDate: studentFollowups.find(f => !f.completed)!.scheduled_date,
          reason: studentFollowups.find(f => !f.completed)!.reason,
          completed: studentFollowups.find(f => !f.completed)!.completed,
          completedAt: studentFollowups.find(f => !f.completed)?.completed_at || undefined,
          outcome: studentFollowups.find(f => !f.completed)?.outcome || undefined,
          notes: studentFollowups.find(f => !f.completed)?.notes || undefined,
          createdAt: studentFollowups.find(f => !f.completed)!.created_at,
          updatedAt: studentFollowups.find(f => !f.completed)!.updated_at
        } : undefined;

        // Find trial outcome for this student
        const studentTrialOutcomes = trialOutcomes?.filter(t => t.student_id === student.id) || [];
        const trialOutcome = studentTrialOutcomes.length > 0 ? {
          id: studentTrialOutcomes[studentTrialOutcomes.length - 1].id,
          studentId: studentTrialOutcomes[studentTrialOutcomes.length - 1].student_id,
          sessionId: studentTrialOutcomes[studentTrialOutcomes.length - 1].session_id || undefined,
          outcome: studentTrialOutcomes[studentTrialOutcomes.length - 1].outcome as 'completed' | 'ghosted' | 'rescheduled',
          teacherNotes: studentTrialOutcomes[studentTrialOutcomes.length - 1].teacher_notes || undefined,
          studentBehavior: studentTrialOutcomes[studentTrialOutcomes.length - 1].student_behavior || undefined,
          recommendedPackage: studentTrialOutcomes[studentTrialOutcomes.length - 1].recommended_package || undefined,
          submittedBy: studentTrialOutcomes[studentTrialOutcomes.length - 1].submitted_by,
          submittedAt: studentTrialOutcomes[studentTrialOutcomes.length - 1].submitted_at,
          createdAt: studentTrialOutcomes[studentTrialOutcomes.length - 1].created_at
        } : undefined;

        // Find payment link for this student
        const studentPaymentLinks = paymentLinks?.filter(p => p.student_ids.includes(student.id)) || [];
        const paymentLink = studentPaymentLinks.length > 0 ? {
          id: studentPaymentLinks[0].id,
          studentIds: studentPaymentLinks[0].student_ids,
          packageId: studentPaymentLinks[0].package_id || undefined,
          currency: studentPaymentLinks[0].currency,
          amount: studentPaymentLinks[0].amount,
          stripeSessionId: studentPaymentLinks[0].stripe_session_id || undefined,
          createdBy: studentPaymentLinks[0].created_by,
          expiresAt: studentPaymentLinks[0].expires_at,
          clickedAt: studentPaymentLinks[0].clicked_at || undefined,
          paidAt: studentPaymentLinks[0].paid_at || undefined,
          status: studentPaymentLinks[0].status as 'pending' | 'clicked' | 'expired' | 'paid',
          createdAt: studentPaymentLinks[0].created_at,
          updatedAt: studentPaymentLinks[0].updated_at
        } : undefined;

        return {
          id: student.id,
          uniqueId: student.unique_id,
          name: student.name,
          age: student.age,
          phone: student.phone,
          country: student.country,
          platform: student.platform as 'zoom' | 'google-meet',
          notes: student.notes || undefined,
          status: student.status as any,
          parentName: student.parent_name || undefined,
          assignedTeacher: student.assigned_teacher_id || undefined,
          assignedSalesAgent: student.assigned_sales_agent_id,
          assignedSupervisor: student.assigned_supervisor_id || undefined,
          trialDate: student.trial_date || undefined,
          trialTime: student.trial_time || undefined,
          teacherType: student.teacher_type as any,
          createdAt: student.created_at,
          updatedAt: student.updated_at,
          lastWhatsAppContact,
          pendingFollowUp,
          trialOutcome,
          paymentLink
        };
      });

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
