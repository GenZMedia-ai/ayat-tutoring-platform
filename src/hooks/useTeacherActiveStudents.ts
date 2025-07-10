
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StudentProgress {
  studentId: string;
  studentName: string;
  studentAge: number;
  studentPhone: string;
  platform: string;
  packageSessionCount: number;
  totalSessions: number;
  completedSessions: number;
  nextSessionDate?: string;
  nextSessionTime?: string;
  status: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  notes?: string;
}

export interface ActiveFamilyGroup {
  id: string;
  type: 'family';
  parentName: string;
  parentPhone: string;
  students: StudentProgress[];
  totalSessions: number;
  completedSessions: number;
  familyName: string;
}

export type ActiveStudentItem = StudentProgress | ActiveFamilyGroup;

export const useTeacherActiveStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<ActiveStudentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActiveStudents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('👨‍🏫 FIXED: Fetching active students with enhanced filtering:', user.id);

      // FIXED: Enhanced query with broader status filtering
      const { data: activeStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('assigned_teacher_id', user.id)
        .in('status', ['active', 'paid']) // FIXED: Include both active and paid students
        .order('created_at', { ascending: false });

      if (studentsError) {
        console.error('❌ FIXED: Error fetching active students:', studentsError);
        throw studentsError;
      }

      console.log('✅ FIXED: Active students found:', activeStudents?.length || 0);

      if (!activeStudents || activeStudents.length === 0) {
        console.log('📝 FIXED: No active students found');
        setStudents([]);
        return;
      }

      // FIXED: Process individual students and family groups with better error handling
      const familyGroups = new Map<string, any>();
      const individualStudents: StudentProgress[] = [];

      for (const student of activeStudents) {
        try {
          // Get session progress for this student
          const { data: sessionData } = await supabase
            .from('sessions')
            .select(`
              id,
              session_number,
              status,
              scheduled_date,
              scheduled_time,
              session_students!inner(student_id)
            `)
            .eq('session_students.student_id', student.id)
            .order('session_number');

          const totalSessions = sessionData?.length || 0;
          const completedSessions = sessionData?.filter(s => s.status === 'completed').length || 0;
          
          // Find next upcoming session
          const nextSession = sessionData?.find(s => 
            s.status === 'scheduled' && 
            new Date(s.scheduled_date) >= new Date()
          );

          const studentProgress: StudentProgress = {
            studentId: student.id,
            studentName: student.name,
            studentAge: student.age,
            studentPhone: student.phone,
            platform: student.platform,
            packageSessionCount: student.package_session_count || 8,
            totalSessions,
            completedSessions,
            nextSessionDate: nextSession?.scheduled_date,
            nextSessionTime: nextSession?.scheduled_time,
            status: student.status,
            paymentAmount: student.payment_amount,
            paymentCurrency: student.payment_currency,
            notes: student.notes
          };

          if (student.family_group_id) {
            // Handle family group
            if (!familyGroups.has(student.family_group_id)) {
              // Get family group info
              const { data: familyData } = await supabase
                .from('family_groups')
                .select('*')
                .eq('id', student.family_group_id)
                .single();

              familyGroups.set(student.family_group_id, {
                id: student.family_group_id,
                type: 'family',
                parentName: familyData?.parent_name || student.parent_name || 'Unknown Family',
                parentPhone: familyData?.phone || student.phone,
                familyName: familyData?.parent_name || student.parent_name || 'Unknown Family',
                students: [],
                totalSessions: 0,
                completedSessions: 0
              });
            }

            const family = familyGroups.get(student.family_group_id);
            family.students.push(studentProgress);
            family.totalSessions += totalSessions;
            family.completedSessions += completedSessions;
          } else {
            individualStudents.push(studentProgress);
          }
        } catch (error) {
          console.error('❌ FIXED: Error processing student:', student.id, error);
          // FIXED: Still include student with minimal data if processing fails
          const basicStudent: StudentProgress = {
            studentId: student.id,
            studentName: student.name,
            studentAge: student.age,
            studentPhone: student.phone,
            platform: student.platform,
            packageSessionCount: student.package_session_count || 8,
            totalSessions: 0,
            completedSessions: 0,
            status: student.status,
            paymentAmount: student.payment_amount,
            paymentCurrency: student.payment_currency,
            notes: student.notes
          };

          if (!student.family_group_id) {
            individualStudents.push(basicStudent);
          }
        }
      }

      // FIXED: Combine results with proper typing
      const allStudents: ActiveStudentItem[] = [
        ...individualStudents,
        ...Array.from(familyGroups.values()) as ActiveFamilyGroup[]
      ];

      console.log('✅ FIXED: Processed active students:', {
        individual: individualStudents.length,
        families: familyGroups.size,
        total: allStudents.length
      });

      setStudents(allStudents);
    } catch (error) {
      console.error('❌ FIXED: Error in fetchActiveStudents:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshStudents = () => {
    fetchActiveStudents();
  };

  useEffect(() => {
    fetchActiveStudents();
  }, [user]);

  return {
    students,
    loading,
    refreshStudents
  };
};
