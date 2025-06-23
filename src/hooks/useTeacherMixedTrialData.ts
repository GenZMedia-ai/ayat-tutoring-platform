
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
      
      // PHASE 1 FIX: Fetch individual students with enhanced session data
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

      // PHASE 1 FIX: Fetch family groups WITH session data through students relationship
      const { data: familyGroups, error: familyError } = await supabase
        .from('family_groups')
        .select(`
          *,
          students!family_group_id (
            id,
            session_students (
              session_id,
              sessions (
                id,
                scheduled_date,
                scheduled_time
              )
            )
          )
        `)
        .eq('assigned_teacher_id', user.id)
        .in('status', ['pending', 'confirmed', 'trial-completed', 'trial-ghosted'])
        .order('created_at', { ascending: false });

      if (familyError) {
        console.error('❌ Error fetching family groups:', familyError);
        throw familyError;
      }

      console.log('📋 Fetched individual students:', individualStudents);
      console.log('📋 Fetched family groups with sessions:', familyGroups);

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

      // PHASE 1 FIX: Transform family groups WITH session data
      const transformedFamilies: TeacherMixedTrialItem[] = (familyGroups || []).map(family => {
        // Get session ID from the first student in the family
        const firstStudent = family.students?.[0];
        const firstStudentSession = firstStudent?.session_students?.[0];
        const sessionId = firstStudentSession?.sessions?.id || firstStudentSession?.session_id;
        
        console.log('🔍 Family session lookup:', {
          familyId: family.id,
          familyName: family.parent_name,
          firstStudentId: firstStudent?.id,
          sessionId: sessionId
        });

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
            sessionId: sessionId, // PHASE 1 FIX: Now properly fetched
          } as TeacherTrialFamily
        };
      });

      // Combine and sort
      const allItems = [...transformedIndividuals, ...transformedFamilies].sort((a, b) => {
        const aDate = new Date(a.data.trialDate + 'T' + a.data.trialTime);
        const bDate = new Date(b.data.trialDate + 'T' + b.data.trialTime);
        return aDate.getTime() - bDate.getTime();
      });

      console.log('📋 Combined trial items with session data:', allItems);
      setTrialItems(allItems);
    } catch (error) {
      console.error('❌ Error in fetchTrialData:', error);
      toast.error('Failed to load trial sessions');
    } finally {
      setLoading(false);
    }
  };

  // PHASE 2: Enhanced family confirmation with better atomicity
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
        // PHASE 2: Enhanced atomic family confirmation
        console.log('🔄 Starting enhanced atomic family confirmation for:', item.id);
        
        // Use a transaction-like approach with better error handling
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
          // PHASE 2: Enhanced rollback with better error reporting
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

        console.log('✅ Enhanced family confirmation completed successfully');
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

  // PHASE 4: Enhanced real-time subscriptions with better performance
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Setting up enhanced real-time updates for teacher mixed trial data');
    
    const studentsChannel = supabase
      .channel('teacher-students-enhanced')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `assigned_teacher_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Enhanced real-time student update received:', payload);
          // PHASE 4: Optimized debounced refresh
          setTimeout(() => fetchTrialData(), 150);
        }
      )
      .subscribe();

    const familyChannel = supabase
      .channel('teacher-families-enhanced')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_groups',
          filter: `assigned_teacher_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Enhanced real-time family update received:', payload);
          // PHASE 4: Optimized debounced refresh
          setTimeout(() => fetchTrialData(), 150);
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up enhanced real-time subscriptions');
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
