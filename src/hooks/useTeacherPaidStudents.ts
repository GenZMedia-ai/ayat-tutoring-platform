
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DateRange } from '@/components/teacher/DateFilter';

export interface PaidStudent {
  id: string;
  uniqueId: string;
  name: string;
  age: number;
  phone: string;
  country: string;
  platform: string;
  parentName?: string;
  packageSessionCount: number;
  packageName: string;
  paymentAmount: number;
  paymentCurrency: string;
  paymentDate: string;
  notes?: string;
  hasCompletedRegistration: boolean;
  isFamilyMember: boolean;
  isScheduled: boolean;
}

export interface FamilyCardData {
  id: string;
  type: 'family';
  familyName: string;
  parentName: string;
  parentPhone: string;
  students: PaidStudent[];
  totalStudents: number;
  scheduledStudents: number;
  totalSessions: number;
  completedSessions: number;
}

export type PaidStudentItem = PaidStudent | FamilyCardData;

export const useTeacherPaidStudents = (dateRange: DateRange = 'today') => {
  const { user } = useAuth();
  const [students, setStudents] = useState<PaidStudentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPaidStudents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('💰 FIXED: Fetching paid students with enhanced Edge Function call');

      // FIXED: Call the enhanced Edge Function for better data processing
      const { data, error } = await supabase.functions.invoke('get-teacher-paid-students-enhanced', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: {
          dateRange,
          teacherId: user.id
        }
      });

      if (error) {
        console.error('❌ FIXED: Error calling paid students function:', error);
        
        // FIXED: Fallback to direct database query with enhanced filtering
        console.log('🔄 FIXED: Falling back to direct database query');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('students')
          .select('*')
          .eq('assigned_teacher_id', user.id)
          .in('status', ['paid', 'active']) // FIXED: Include both paid and active
          .order('created_at', { ascending: false });

        if (fallbackError) {
          console.error('❌ FIXED: Fallback query failed:', fallbackError);
          setStudents([]);
          return;
        }

        // FIXED: Process fallback data
        const processedFallback = await processFallbackData(fallbackData || []);
        setStudents(processedFallback);
        return;
      }

      console.log('✅ FIXED: Enhanced paid students data received:', data?.length || 0);
      setStudents(data || []);
    } catch (error) {
      console.error('❌ FIXED: Error in fetchPaidStudents:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const processFallbackData = async (studentsData: any[]): Promise<PaidStudentItem[]> => {
    const familyGroups = new Map<string, any>();
    const individualStudents: PaidStudent[] = [];

    for (const student of studentsData) {
      try {
        // Check if student has completed registration (has sessions beyond trial)
        const { data: sessionData } = await supabase
          .from('session_students')
          .select('sessions!inner(session_number)')
          .eq('student_id', student.id)
          .gt('sessions.session_number', 1);

        const hasCompletedRegistration = (sessionData?.length || 0) > 0;

        const processedStudent: PaidStudent = {
          id: student.id,
          uniqueId: student.unique_id,
          name: student.name,
          age: student.age,
          phone: student.phone,
          country: student.country,
          platform: student.platform,
          parentName: student.parent_name,
          packageSessionCount: student.package_session_count || 8,
          packageName: student.package_name || 'Standard Package',
          paymentAmount: student.payment_amount || 0,
          paymentCurrency: (student.payment_currency || 'USD').toUpperCase(),
          paymentDate: student.created_at,
          notes: student.notes,
          hasCompletedRegistration,
          isFamilyMember: !!student.family_group_id,
          isScheduled: hasCompletedRegistration
        };

        if (student.family_group_id) {
          if (!familyGroups.has(student.family_group_id)) {
            familyGroups.set(student.family_group_id, {
              id: student.family_group_id,
              type: 'family',
              familyName: student.parent_name || 'Unknown Family',
              parentName: student.parent_name,
              parentPhone: student.phone,
              students: [],
              totalStudents: 0,
              scheduledStudents: 0,
              totalSessions: 0,
              completedSessions: 0
            });
          }
          
          const family = familyGroups.get(student.family_group_id);
          family.students.push(processedStudent);
          family.totalStudents++;
          family.totalSessions += processedStudent.packageSessionCount;
          if (processedStudent.isScheduled) {
            family.scheduledStudents++;
          }
        } else {
          individualStudents.push(processedStudent);
        }
      } catch (error) {
        console.error('❌ FIXED: Error processing student in fallback:', error);
      }
    }

    const result = [...individualStudents, ...Array.from(familyGroups.values())];
    console.log('✅ FIXED: Processed fallback data:', result.length);
    return result;
  };

  useEffect(() => {
    fetchPaidStudents();
  }, [user, dateRange]);

  return {
    students,
    loading,
    refreshStudents: fetchPaidStudents
  };
};
