
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudent } from '@/types/trial';
import { toast } from 'sonner';

export interface MixedStudentItem {
  type: 'individual' | 'family';
  id: string;
  data: TrialSessionFlowStudent | FamilyGroup;
}

export const useMixedStudentData = () => {
  const [items, setItems] = useState<MixedStudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMixedData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Base query filters based on user role
      let studentsQuery = supabase.from('students').select('*');
      let familyGroupsQuery = supabase.from('family_groups').select('*');

      // Filter based on user role
      if (user.role === 'teacher') {
        studentsQuery = studentsQuery.eq('assigned_teacher_id', user.id);
        familyGroupsQuery = familyGroupsQuery.eq('assigned_teacher_id', user.id);
      } else if (user.role === 'sales') {
        studentsQuery = studentsQuery.eq('assigned_sales_agent_id', user.id);
        familyGroupsQuery = familyGroupsQuery.eq('assigned_sales_agent_id', user.id);
      }

      // Fetch individual students (those not part of family groups)
      const { data: individualStudents, error: studentsError } = await studentsQuery
        .is('family_group_id', null)
        .order('created_at', { ascending: false });

      if (studentsError) {
        console.error('Error fetching individual students:', studentsError);
        throw studentsError;
      }

      // Fetch family groups
      const { data: familyGroups, error: familyError } = await familyGroupsQuery
        .order('created_at', { ascending: false });

      if (familyError) {
        console.error('Error fetching family groups:', familyError);
        throw familyError;
      }

      // Fetch related data for individual students
      const individualStudentIds = individualStudents?.map(s => s.id) || [];
      
      let trialOutcomes: any[] = [];
      let whatsappContacts: any[] = [];
      let paymentLinks: any[] = [];
      let salesFollowups: any[] = [];

      if (individualStudentIds.length > 0) {
        const [
          { data: outcomes },
          { data: contacts },
          { data: payments },
          { data: followups }
        ] = await Promise.all([
          supabase.from('trial_outcomes').select('*').in('student_id', individualStudentIds),
          supabase.from('whatsapp_contacts').select('*').in('student_id', individualStudentIds).order('contacted_at', { ascending: false }),
          supabase.from('payment_links').select('*').order('created_at', { ascending: false }),
          supabase.from('sales_followups').select('*').in('student_id', individualStudentIds)
        ]);

        trialOutcomes = outcomes || [];
        whatsappContacts = contacts || [];
        paymentLinks = payments || [];
        salesFollowups = followups || [];
      }

      // Transform individual students
      const transformedIndividuals: MixedStudentItem[] = (individualStudents || []).map(student => {
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
          type: 'individual' as const,
          id: student.id,
          data: {
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
          }
        };
      });

      // Transform family groups
      const transformedFamilies: MixedStudentItem[] = (familyGroups || []).map(family => ({
        type: 'family' as const,
        id: family.id,
        data: {
          id: family.id,
          unique_id: family.unique_id,
          parent_name: family.parent_name,
          phone: family.phone,
          country: family.country,
          platform: family.platform as 'zoom' | 'google-meet',
          notes: family.notes || undefined,
          status: family.status as FamilyGroup['status'],
          assigned_teacher_id: family.assigned_teacher_id || undefined,
          assigned_sales_agent_id: family.assigned_sales_agent_id,
          assigned_supervisor_id: family.assigned_supervisor_id || undefined,
          trial_date: family.trial_date || undefined,
          trial_time: family.trial_time || undefined,
          teacher_type: family.teacher_type as FamilyGroup['teacher_type'],
          student_count: family.student_count,
          created_at: family.created_at,
          updated_at: family.updated_at
        }
      }));

      // Combine and sort by creation date - FIX: Use consistent property names
      const allItems = [...transformedIndividuals, ...transformedFamilies].sort((a, b) => {
        const aDate = new Date(
          a.type === 'individual' 
            ? (a.data as TrialSessionFlowStudent).createdAt 
            : (a.data as FamilyGroup).created_at
        );
        const bDate = new Date(
          b.type === 'individual' 
            ? (b.data as TrialSessionFlowStudent).createdAt 
            : (b.data as FamilyGroup).created_at
        );
        return bDate.getTime() - aDate.getTime();
      });

      setItems(allItems);
    } catch (error) {
      console.error('Error in fetchMixedData:', error);
      toast.error('Failed to load trial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMixedData();
  }, [user]);

  const refetchData = () => {
    fetchMixedData();
  };

  // Helper functions for different categories
  const getItemsByStatus = (status: string | string[]) => {
    const statusArray = Array.isArray(status) ? status : [status];
    return items.filter(item => {
      const itemStatus = item.type === 'family' 
        ? (item.data as FamilyGroup).status 
        : (item.data as TrialSessionFlowStudent).status;
      return statusArray.includes(itemStatus);
    });
  };

  const getStatsCount = (status: string) => {
    return getItemsByStatus(status).length;
  };

  const getTotalCount = () => {
    return items.length;
  };

  return {
    items,
    loading,
    refetchData,
    getItemsByStatus,
    getStatsCount,
    getTotalCount
  };
};
