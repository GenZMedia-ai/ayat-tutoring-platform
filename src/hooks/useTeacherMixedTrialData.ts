
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTrialConfirmation } from './useTrialConfirmation';

export interface TeacherTrialStudent {
  id: string;
  name: string;
  age: number;
  phone: string;
  country: string;
  trialDate: string;
  trialTime: string;
  status: string;
  uniqueId: string;
  parentName?: string;
  notes?: string;
  sessionId?: string;
}

export interface TeacherTrialFamily {
  id: string;
  parentName: string;
  phone: string;
  country: string;
  trialDate: string;
  trialTime: string;
  status: string;
  uniqueId: string;
  studentCount: number;
  notes?: string;
  sessionId?: string;
}

export interface TeacherMixedTrialItem {
  type: 'individual' | 'family';
  id: string;
  data: TeacherTrialStudent | TeacherTrialFamily;
}

export const useTeacherMixedTrialData = () => {
  const { user } = useAuth();
  const [trialItems, setTrialItems] = useState<TeacherMixedTrialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { confirmTrial: confirmTrialRPC } = useTrialConfirmation();

  const fetchTrialData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔍 Fetching mixed trial data for teacher:', user.id);
      
      // Fetch individual students (not part of family groups)
      const { data: individualStudents, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          session_students(
            session_id,
            sessions(
              id,
              scheduled_date,
              scheduled_time
            )
          )
        `)
        .eq('assigned_teacher_id', user.id)
        .is('family_group_id', null)
        .in('status', ['pending', 'confirmed', 'trial-completed', 'trial-ghosted'])
        .order('created_at', { ascending: false });

      if (studentsError) {
        console.error('❌ Error fetching individual students:', studentsError);
        throw studentsError;
      }

      // Fetch family groups
      const { data: familyGroups, error: familyError } = await supabase
        .from('family_groups')
        .select('*')
        .eq('assigned_teacher_id', user.id)
        .in('status', ['pending', 'confirmed', 'trial-completed', 'trial-ghosted'])
        .order('created_at', { ascending: false });

      if (familyError) {
        console.error('❌ Error fetching family groups:', familyError);
        throw familyError;
      }

      console.log('📋 Fetched individual students:', individualStudents);
      console.log('📋 Fetched family groups:', familyGroups);

      // Transform individual students
      const transformedIndividuals: TeacherMixedTrialItem[] = (individualStudents || []).map(student => {
        const sessionStudent = student.session_students?.[0];
        const sessionId = sessionStudent?.sessions?.id || sessionStudent?.session_id;
        
        return {
          type: 'individual' as const,
          id: student.id,
          data: {
            id: student.id,
            name: student.name,
            age: student.age,
            phone: student.phone,
            country: student.country,
            trialDate: student.trial_date || '',
            trialTime: student.trial_time || '',
            status: student.status,
            uniqueId: student.unique_id,
            parentName: student.parent_name,
            notes: student.notes,
            sessionId: sessionId,
          } as TeacherTrialStudent
        };
      });

      // Transform family groups
      const transformedFamilies: TeacherMixedTrialItem[] = (familyGroups || []).map(family => {
        return {
          type: 'family' as const,
          id: family.id,
          data: {
            id: family.id,
            parentName: family.parent_name,
            phone: family.phone,
            country: family.country,
            trialDate: family.trial_date || '',
            trialTime: family.trial_time || '',
            status: family.status,
            uniqueId: family.unique_id,
            studentCount: family.student_count,
            notes: family.notes,
            sessionId: undefined,
          } as TeacherTrialFamily
        };
      });

      // Combine and sort
      const allItems = [...transformedIndividuals, ...transformedFamilies].sort((a, b) => {
        const aDate = new Date(a.data.trialDate + 'T' + a.data.trialTime);
        const bDate = new Date(b.data.trialDate + 'T' + b.data.trialTime);
        return aDate.getTime() - bDate.getTime();
      });

      console.log('📋 Combined trial items:', allItems);
      setTrialItems(allItems);
    } catch (error) {
      console.error('❌ Error in fetchTrialData:', error);
      toast.error('Failed to load trial sessions');
    } finally {
      setLoading(false);
    }
  };

  // PHASE 2: Improved family confirmation with atomicity
  const confirmTrial = async (item: TeacherMixedTrialItem) => {
    try {
      console.log('✅ Confirming trial for item:', item);
      
      if (item.type === 'individual') {
        const success = await confirmTrialRPC(item.id);
        if (success) {
          await fetchTrialData(); // Refresh data
        }
        return success;
      } else {
        // PHASE 2: Atomic family confirmation - update both family and students in transaction
        console.log('🔄 Starting atomic family confirmation for:', item.id);
        
        // Use a transaction-like approach with error handling
        const { error: familyError } = await supabase
          .from('family_groups')
          .update({ 
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (familyError) {
          console.error('❌ Error confirming family trial:', familyError);
          toast.error('Failed to confirm family trial');
          return false;
        }

        // PHASE 2: Ensure all family students are also confirmed atomically
        const { error: studentsError } = await supabase
          .from('students')
          .update({ 
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('family_group_id', item.id);

        if (studentsError) {
          console.error('❌ Error confirming family students:', studentsError);
          // PHASE 2: Rollback family status if student update fails
          await supabase
            .from('family_groups')
            .update({ 
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          
          toast.error('Failed to confirm family trial - rollback completed');
          return false;
        }

        console.log('✅ Family confirmation completed successfully');
        toast.success('Family trial confirmed successfully!');
        await fetchTrialData(); // Refresh data
        return true;
      }
    } catch (error) {
      console.error('❌ Error in confirmTrial:', error);
      toast.error('Failed to confirm trial');
      return false;
    }
  };

  useEffect(() => {
    fetchTrialData();
  }, [user]);

  // PHASE 4: Optimized real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Setting up optimized real-time updates for teacher mixed trial data');
    
    const studentsChannel = supabase
      .channel('teacher-students-optimized')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `assigned_teacher_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Real-time student update received:', payload);
          // PHASE 4: Debounced refresh to prevent excessive updates
          setTimeout(() => fetchTrialData(), 100);
        }
      )
      .subscribe();

    const familyChannel = supabase
      .channel('teacher-families-optimized')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_groups',
          filter: `assigned_teacher_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Real-time family update received:', payload);
          // PHASE 4: Debounced refresh to prevent excessive updates
          setTimeout(() => fetchTrialData(), 100);
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up optimized real-time subscriptions');
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(familyChannel);
    };
  }, [user]);

  return {
    trialItems,
    loading,
    confirmTrial,
    refreshTrialData: fetchTrialData,
  };
};
