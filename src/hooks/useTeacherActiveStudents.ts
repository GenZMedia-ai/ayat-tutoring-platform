
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StudentProgress {
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
}

interface SessionHistory {
  sessionNumber: number;
  date: string;
  status: string;
  actualMinutes?: number;
  notes?: string;
  completedAt?: string;
  isTrialSession: boolean;
}

export const useTeacherActiveStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActiveStudents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔍 Fetching active students for teacher:', user.id);

      // Get active students assigned to this teacher
      const { data: activeStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
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
            totalMinutes
          };
        })
      );

      console.log('📊 Students with corrected progress:', studentsWithProgress);
      setStudents(studentsWithProgress);
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
