import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TeacherTrialStudent {
  id: string;
  uniqueId: string;
  name: string;
  age: number;
  phone: string;
  country: string;
  platform: string;
  parentName?: string;
  trialDate?: string;
  trialTime?: string;
  notes?: string;
  status: string;
  sessionId?: string;
}

export interface TeacherTrialFamily {
  id: string;
  uniqueId: string;
  parentName: string;
  phone: string;
  country: string;
  platform: string;
  trialDate?: string;
  trialTime?: string;
  notes?: string;
  status: string;
  studentCount: number;
  sessionId?: string;
}

export interface TeacherMixedTrialItem {
  id: string;
  type: 'individual' | 'family';
  data: TeacherTrialStudent | TeacherTrialFamily;
}

export const useTeacherMixedTrialData = () => {
  const { user } = useAuth();
  const [trialData, setTrialData] = useState<TeacherMixedTrialItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMixedTrialData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔍 Fetching mixed trial data for teacher:', user.id);

      // Fetch individual students
      const { data: individualStudents, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          unique_id,
          name,
          age,
          phone,
          country,
          platform,
          parent_name,
          trial_date,
          trial_time,
          notes,
          status,
          family_group_id
        `)
        .eq('assigned_teacher_id', user.id)
        .in('status', ['pending', 'confirmed'])
        .is('family_group_id', null);

      if (studentsError) {
        console.error('❌ Error fetching individual students:', studentsError);
        throw studentsError;
      }

      // Fetch family groups
      const { data: familyGroups, error: familyError } = await supabase
        .from('family_groups')
        .select(`
          id,
          unique_id,
          parent_name,
          phone,
          country,
          platform,
          trial_date,
          trial_time,
          notes,
          status,
          student_count
        `)
        .eq('assigned_teacher_id', user.id)
        .in('status', ['pending', 'confirmed']);

      if (familyError) {
        console.error('❌ Error fetching family groups:', familyError);
        throw familyError;
      }

      // Enhanced session linking for both individuals and families
      const processedData: TeacherMixedTrialItem[] = [];

      // Process individual students
      if (individualStudents) {
        for (const student of individualStudents) {
          let sessionId: string | undefined;

          if (student.trial_date && student.trial_time) {
            // Find session linked to this student
            const { data: sessionData } = await supabase
              .from('session_students')
              .select(`
                session_id,
                sessions!inner(
                  id,
                  scheduled_date,
                  scheduled_time
                )
              `)
              .eq('student_id', student.id);

            if (sessionData && sessionData.length > 0) {
              sessionId = sessionData[0].session_id;
              console.log('✅ Found session for individual student:', student.name, sessionId);
            } else {
              console.warn('⚠️ No session found for individual student:', student.name);
            }
          }

          processedData.push({
            id: student.id,
            type: 'individual',
            data: {
              id: student.id,
              uniqueId: student.unique_id,
              name: student.name,
              age: student.age,
              phone: student.phone,
              country: student.country,
              platform: student.platform,
              parentName: student.parent_name,
              trialDate: student.trial_date,
              trialTime: student.trial_time,
              notes: student.notes,
              status: student.status,
              sessionId
            }
          });
        }
      }

      // Process family groups with enhanced session linking
      if (familyGroups) {
        for (const family of familyGroups) {
          let sessionId: string | undefined;

          if (family.trial_date && family.trial_time) {
            // Find any student from this family and their session
            const { data: familyStudents } = await supabase
              .from('students')
              .select(`
                id,
                session_students(
                  session_id,
                  sessions!inner(
                    id,
                    scheduled_date,
                    scheduled_time
                  )
                )
              `)
              .eq('family_group_id', family.id)
              .limit(1);

            if (familyStudents && familyStudents.length > 0) {
              const firstStudent = familyStudents[0];
              if (firstStudent.session_students && firstStudent.session_students.length > 0) {
                sessionId = firstStudent.session_students[0].session_id;
                console.log('✅ Found session for family:', family.parent_name, sessionId);
              } else {
                console.warn('⚠️ No session linked for family:', family.parent_name);
                
                // Try to find session by date/time match
                const { data: matchingSessions } = await supabase
                  .from('sessions')
                  .select('id')
                  .eq('scheduled_date', family.trial_date)
                  .eq('scheduled_time', family.trial_time)
                  .limit(1);

                if (matchingSessions && matchingSessions.length > 0) {
                  sessionId = matchingSessions[0].id;
                  console.log('✅ Found matching session by date/time for family:', family.parent_name, sessionId);
                }
              }
            }
          }

          processedData.push({
            id: family.id,
            type: 'family',
            data: {
              id: family.id,
              uniqueId: family.unique_id,
              parentName: family.parent_name,
              phone: family.phone,
              country: family.country,
              platform: family.platform,
              trialDate: family.trial_date,
              trialTime: family.trial_time,
              notes: family.notes,
              status: family.status,
              studentCount: family.student_count,
              sessionId
            }
          });
        }
      }

      console.log('📋 Processed mixed trial data:', {
        totalItems: processedData.length,
        individuals: processedData.filter(item => item.type === 'individual').length,
        families: processedData.filter(item => item.type === 'family').length
      });

      setTrialData(processedData);
    } catch (error) {
      console.error('❌ Error fetching mixed trial data:', error);
      toast.error('Failed to load trial data');
    } finally {
      setLoading(false);
    }
  };

  const confirmTrial = async (item: TeacherMixedTrialItem): Promise<boolean> => {
    try {
      console.log('✅ Confirming trial for item:', item.type, item.id);
      
      if (item.type === 'individual') {
        const studentData = item.data as TeacherTrialStudent;
        
        const { data, error } = await supabase.rpc('confirm_trial', {
          p_student_id: studentData.id
        });
        
        if (error) {
          console.error('❌ Error confirming individual trial:', error);
          toast.error('Failed to confirm trial: ' + error.message);
          return false;
        }
        
        console.log('✅ Individual trial confirmed:', data);
        toast.success('Trial confirmed successfully');
        
      } else {
        // For family trials, confirm using the first student from the family
        const { data: familyStudents, error: fetchError } = await supabase
          .from('students')
          .select('id')
          .eq('family_group_id', item.id)
          .limit(1);
          
        if (fetchError || !familyStudents || familyStudents.length === 0) {
          console.error('❌ Error fetching family student for confirmation:', fetchError);
          toast.error('Failed to find family student data');
          return false;
        }
        
        const { data, error } = await supabase.rpc('confirm_trial', {
          p_student_id: familyStudents[0].id
        });
        
        if (error) {
          console.error('❌ Error confirming family trial:', error);
          toast.error('Failed to confirm family trial: ' + error.message);
          return false;
        }
        
        console.log('✅ Family trial confirmed:', data);
        toast.success('Family trial confirmed successfully');
      }
      
      // Refresh the data after successful confirmation
      await fetchMixedTrialData();
      return true;
      
    } catch (error: any) {
      console.error('❌ Error in confirmTrial:', error);
      toast.error('Failed to confirm trial: ' + error.message);
      return false;
    }
  };

  useEffect(() => {
    fetchMixedTrialData();
  }, [user]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Setting up real-time updates for mixed trial data');
    
    const channel = supabase
      .channel('teacher-mixed-trials')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `assigned_teacher_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Student update received:', payload);
          fetchMixedTrialData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_groups',
          filter: `assigned_teacher_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Family group update received:', payload);
          fetchMixedTrialData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        (payload) => {
          console.log('🔄 Session update received:', payload);
          fetchMixedTrialData();
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    trialData,
    loading,
    refreshTrialData: fetchMixedTrialData,
    confirmTrial
  };
};
