
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StudentProgress {
  studentId: string;
  studentName: string;
  uniqueId: string;
  age: number;
  phone: string;
  country: string;
  platform: string;
  parentName?: string;
  notes?: string;
  totalPaidSessions: number;
  completedPaidSessions: number;
  sessionsRemaining: number;
  nextSessionDate?: string;
  nextSessionTime?: string;
  sessionHistory: SessionHistory[];
  totalMinutes: number;
  familyGroupId?: string;
}

export interface SessionHistory {
  sessionNumber: number;
  date: string;
  status: string;
  actualMinutes?: number;
  notes?: string;
  completedAt?: string;
  isTrialSession: boolean;
}

export interface ActiveFamilyGroup {
  id: string;
  type: 'family';
  familyName: string;
  parentName: string;
  parentPhone: string;
  students: StudentProgress[];
  totalStudents: number;
  totalSessions: number;
  completedSessions: number;
  totalMinutes: number;
  nextFamilySession?: {
    date: string;
    time: string;
    studentName: string;
  };
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
      console.log('🔍 Fetching active students for teacher:', user.id);

      // Get active students assigned to this teacher
      const { data: activeStudents, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          family_groups!students_family_group_id_fkey(id, parent_name, phone)
        `)
        .eq('assigned_teacher_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (studentsError) {
        console.error('❌ Error fetching active students:', studentsError);
        return;
      }

      if (!activeStudents || activeStudents.length === 0) {
        console.log('📝 No active students found');
        setStudents([]);
        return;
      }

      // Get session data for each student
      const studentsWithProgress = await Promise.all(
        activeStudents.map(async (student) => {
          // Get all sessions for this student
          const { data: sessionData } = await supabase
            .from('sessions')
            .select(`
              id,
              session_number,
              scheduled_date,
              scheduled_time,
              status,
              actual_minutes,
              notes,
              completed_at,
              trial_outcome,
              session_students!inner(student_id)
            `)
            .eq('session_students.student_id', student.id)
            .order('session_number');

          const sessions = sessionData || [];
          
          // CRITICAL FIX: Separate trial and paid sessions
          const paidSessions = sessions.filter(s => s.trial_outcome === null);
          const trialSessions = sessions.filter(s => s.trial_outcome !== null);
          
          // Use package_session_count for total paid sessions (not counting trials)
          const totalPaidSessions = student.package_session_count || 8;
          const completedPaidSessions = paidSessions.filter(s => s.status === 'completed').length;
          const sessionsRemaining = totalPaidSessions - completedPaidSessions;
          
          // Calculate total minutes from completed paid sessions only
          const totalMinutes = paidSessions
            .filter(s => s.status === 'completed' && s.actual_minutes)
            .reduce((sum, s) => sum + (s.actual_minutes || 0), 0);

          // Find next scheduled paid session (not trial)
          const nextPaidSession = paidSessions.find(s => s.status === 'scheduled');

          // Build comprehensive session history including both trial and paid sessions
          const sessionHistory: SessionHistory[] = sessions.map(s => ({
            sessionNumber: s.session_number,
            date: s.scheduled_date,
            status: s.status,
            actualMinutes: s.actual_minutes,
            notes: s.notes,
            completedAt: s.completed_at,
            isTrialSession: s.trial_outcome !== null
          }));

          console.log(`📊 Student ${student.name} progress:`, {
            totalSessions: sessions.length,
            paidSessions: paidSessions.length,
            trialSessions: trialSessions.length,
            totalPaidSessions,
            completedPaidSessions,
            sessionsRemaining
          });

          return {
            studentId: student.id,
            studentName: student.name,
            uniqueId: student.unique_id,
            age: student.age,
            phone: student.phone,
            country: student.country,
            platform: student.platform,
            parentName: student.parent_name,
            notes: student.notes,
            totalPaidSessions,
            completedPaidSessions,
            sessionsRemaining,
            nextSessionDate: nextPaidSession?.scheduled_date,
            nextSessionTime: nextPaidSession?.scheduled_time,
            sessionHistory,
            totalMinutes,
            familyGroupId: student.family_group_id
          };
        })
      );

      // Group students by family
      const familyMap = new Map<string, StudentProgress[]>();
      const individualStudents: StudentProgress[] = [];

      studentsWithProgress.forEach(student => {
        if (student.familyGroupId) {
          const familyId = student.familyGroupId;
          if (!familyMap.has(familyId)) {
            familyMap.set(familyId, []);
          }
          familyMap.get(familyId)!.push(student);
        } else {
          individualStudents.push(student);
        }
      });

      // Create family group objects
      const familyGroups: ActiveFamilyGroup[] = [];
      for (const [familyId, familyStudents] of familyMap) {
        const firstStudent = familyStudents[0];
        const familyInfo = activeStudents.find(s => s.id === firstStudent.studentId)?.family_groups;
        
        // Calculate family totals
        const totalSessions = familyStudents.reduce((sum, s) => sum + s.totalPaidSessions, 0);
        const completedSessions = familyStudents.reduce((sum, s) => sum + s.completedPaidSessions, 0);
        const totalMinutes = familyStudents.reduce((sum, s) => sum + s.totalMinutes, 0);
        
        // Find next family session (earliest next session among all family members)
        const nextSessions = familyStudents
          .filter(s => s.nextSessionDate && s.nextSessionTime)
          .map(s => ({
            date: s.nextSessionDate!,
            time: s.nextSessionTime!,
            studentName: s.studentName,
            dateTime: new Date(`${s.nextSessionDate}T${s.nextSessionTime}`)
          }))
          .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

        familyGroups.push({
          id: familyId,
          type: 'family',
          familyName: familyInfo?.parent_name || firstStudent.parentName || 'Unknown Family',
          parentName: familyInfo?.parent_name || firstStudent.parentName || 'Unknown',
          parentPhone: familyInfo?.phone || firstStudent.phone,
          students: familyStudents,
          totalStudents: familyStudents.length,
          totalSessions,
          completedSessions,
          totalMinutes,
          nextFamilySession: nextSessions.length > 0 ? {
            date: nextSessions[0].date,
            time: nextSessions[0].time,
            studentName: nextSessions[0].studentName
          } : undefined
        });
      }

      // Combine individual students and family groups
      const result: ActiveStudentItem[] = [...individualStudents, ...familyGroups];
      
      console.log('📊 Active students with family grouping:', {
        total: result.length,
        individuals: individualStudents.length,
        families: familyGroups.length
      });
      
      setStudents(result);
    } catch (error) {
      console.error('❌ Error in fetchActiveStudents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveStudents();
  }, [user]);

  return {
    students,
    loading,
    refreshStudents: fetchActiveStudents
  };
};
