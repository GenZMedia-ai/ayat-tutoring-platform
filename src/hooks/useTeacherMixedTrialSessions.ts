
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FamilyGroup } from '@/types/family';

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

export const useTeacherMixedTrialSessions = () => {
  const { user } = useAuth();
  const [trialItems, setTrialItems] = useState<TeacherMixedTrialItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrialSessions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔍 Fetching mixed trial sessions for teacher:', user.id);
      
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
        .in('status', ['pending', 'confirmed'])
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
        .in('status', ['pending', 'confirmed'])
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
        // For families, we'll need to get the session ID from one of the family students
        // This is a temporary solution - ideally we'd link sessions directly to families
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
            sessionId: undefined, // Will be set separately if needed
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
      console.error('❌ Error in fetchTrialSessions:', error);
      toast.error('Failed to load trial sessions');
    } finally {
      setLoading(false);
    }
  };

  const confirmTrial = async (item: TeacherMixedTrialItem) => {
    try {
      console.log('✅ Confirming trial for item:', item);
      
      if (item.type === 'individual') {
        const { error } = await supabase
          .from('students')
          .update({ 
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (error) {
          console.error('❌ Error confirming individual trial:', error);
          toast.error('Failed to confirm trial');
          return false;
        }
      } else {
        // Confirm family group and all associated students
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

        // Also update all students in the family
        const { error: studentsError } = await supabase
          .from('students')
          .update({ 
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('family_group_id', item.id);

        if (studentsError) {
          console.error('❌ Error confirming family students:', studentsError);
          // Don't fail the whole operation, just log it
        }
      }

      toast.success('Trial confirmed successfully!');
      await fetchTrialSessions(); // Refresh data
      return true;
    } catch (error) {
      console.error('❌ Error in confirmTrial:', error);
      toast.error('Failed to confirm trial');
      return false;
    }
  };

  useEffect(() => {
    fetchTrialSessions();
  }, [user]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Setting up real-time updates for teacher mixed trial sessions');
    
    const studentsChannel = supabase
      .channel('teacher-students')
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
          fetchTrialSessions();
        }
      )
      .subscribe();

    const familyChannel = supabase
      .channel('teacher-families')
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
          fetchTrialSessions();
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscriptions');
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(familyChannel);
    };
  }, [user]);

  return {
    trialItems,
    loading,
    confirmTrial,
    refreshTrialSessions: fetchTrialSessions,
  };
};
