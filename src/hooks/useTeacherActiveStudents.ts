
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
  sessionsRemaining: number;
  nextSessionDate?: string;
  nextSessionTime?: string;
  status: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  notes?: string;
  uniqueId: string;
  age: number;
  phone: string;
  country: string;
  totalMinutes: number;
  sessionHistory: Array<{
    sessionNumber: number;
    date: string;
    status: string;
    actualMinutes?: number;
    notes?: string;
    isTrialSession: boolean;
  }>;
  completedPaidSessions: number;
  totalPaidSessions: number;
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
  totalStudents: number;
  totalMinutes: number;
  nextFamilySession?: {
    studentName: string;
    date: string;
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
              actual_minutes,
              notes,
              session_students!inner(student_id)
            `)
            .eq('session_students.student_id', student.id)
            .order('session_number');

          const totalSessions = sessionData?.length || 0;
          const completedSessions = sessionData?.filter(s => s.status === 'completed').length || 0;
          const totalMinutes = sessionData?.reduce((sum, s) => sum + (s.actual_minutes || 0), 0) || 0;
          
          // Find next upcoming session
          const nextSession = sessionData?.find(s => 
            s.status === 'scheduled' && 
            new Date(s.scheduled_date) >= new Date()
          );

          // Build session history
          const sessionHistory = sessionData?.map(s => ({
            sessionNumber: s.session_number,
            date: s.scheduled_date,
            status: s.status,
            actualMinutes: s.actual_minutes,
            notes: s.notes,
            isTrialSession: s.session_number === 1
          })) || [];

          // Calculate sessions remaining
          const sessionsRemaining = Math.max(0, (student.package_session_count || 8) - completedSessions);

          const studentProgress: StudentProgress = {
            studentId: student.id,
            studentName: student.name,
            studentAge: student.age,
            studentPhone: student.phone,
            platform: student.platform,
            packageSessionCount: student.package_session_count || 8,
            totalSessions,
            completedSessions,
            sessionsRemaining,
            nextSessionDate: nextSession?.scheduled_date,
            nextSessionTime: nextSession?.scheduled_time,
            status: student.status,
            paymentAmount: student.payment_amount,
            paymentCurrency: student.payment_currency,
            notes: student.notes,
            uniqueId: student.unique_id,
            age: student.age,
            phone: student.phone,
            country: student.country,
            totalMinutes,
            sessionHistory,
            completedPaidSessions: sessionHistory.filter(s => s.status === 'completed' && !s.isTrialSession).length,
            totalPaidSessions: sessionHistory.filter(s => !s.isTrialSession).length
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
                completedSessions: 0,
                totalStudents: 0,
                totalMinutes: 0,
                nextFamilySession: null
              });
            }

            const family = familyGroups.get(student.family_group_id);
            family.students.push(studentProgress);
            family.totalSessions += totalSessions;
            family.completedSessions += completedSessions;
            family.totalStudents++;
            family.totalMinutes += totalMinutes;
            
            // Set next family session if this student has the earliest upcoming session
            if (nextSession && (!family.nextFamilySession || new Date(nextSession.scheduled_date) < new Date(family.nextFamilySession.date))) {
              family.nextFamilySession = {
                studentName: student.name,
                date: nextSession.scheduled_date
              };
            }
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
            sessionsRemaining: student.package_session_count || 8,
            status: student.status,
            paymentAmount: student.payment_amount,
            paymentCurrency: student.payment_currency,
            notes: student.notes,
            uniqueId: student.unique_id,
            age: student.age,
            phone: student.phone,
            country: student.country,
            totalMinutes: 0,
            sessionHistory: [],
            completedPaidSessions: 0,
            totalPaidSessions: 0
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
