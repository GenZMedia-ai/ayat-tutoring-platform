
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BusinessMetrics {
  // Student Metrics
  totalStudents: number;
  activeStudents: number;
  trialStudents: number;
  paidStudents: number;
  expiredStudents: number;
  
  // Status Breakdown
  statusBreakdown: {
    pending: number;
    confirmed: number;
    trialCompleted: number;
    awaitingPayment: number;
    paid: number;
    active: number;
    expired: number;
    cancelled: number;
    dropped: number;
  };
  
  // Teacher Type Distribution
  teacherTypeBreakdown: {
    kids: number;
    adult: number;
    mixed: number;
    expert: number;
  };
  
  // Financial Metrics
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerStudent: number;
  outstandingPayments: number;
  
  // Conversion Metrics
  trialConversionRate: number;
  paymentConversionRate: number;
  ghostRate: number;
  
  // Session Metrics
  totalSessions: number;
  completedSessions: number;
  scheduledSessions: number;
  cancelledSessions: number;
  sessionCompletionRate: number;
  
  // Teacher Performance
  teacherUtilizationRate: number;
  avgStudentsPerTeacher: number;
  
  // Time-based Metrics
  last30DaysGrowth: number;
  last7DaysActivity: number;
}

export const useBusinessHealthMetrics = () => {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinessMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch students data
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*');

      if (studentsError) throw studentsError;

      // Fetch payment links data separately 
      const { data: paymentLinks, error: paymentLinksError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('status', 'paid');

      if (paymentLinksError) throw paymentLinksError;

      // Fetch all sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*');

      if (sessionsError) throw sessionsError;

      // Fetch teacher availability for utilization
      const { data: availability, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select('*');

      if (availabilityError) throw availabilityError;

      // Calculate metrics
      const totalStudents = students?.length || 0;
      
      // Status breakdown
      const statusBreakdown = {
        pending: students?.filter(s => s.status === 'pending').length || 0,
        confirmed: students?.filter(s => s.status === 'confirmed').length || 0,
        trialCompleted: students?.filter(s => s.status === 'trial-completed').length || 0,
        awaitingPayment: students?.filter(s => s.status === 'awaiting-payment').length || 0,
        paid: students?.filter(s => s.status === 'paid').length || 0,
        active: students?.filter(s => s.status === 'active').length || 0,
        expired: students?.filter(s => s.status === 'expired').length || 0,
        cancelled: students?.filter(s => s.status === 'cancelled').length || 0,
        dropped: students?.filter(s => s.status === 'dropped').length || 0,
      };

      // Teacher type breakdown
      const teacherTypeBreakdown = {
        kids: students?.filter(s => s.teacher_type === 'kids').length || 0,
        adult: students?.filter(s => s.teacher_type === 'adult').length || 0,
        mixed: students?.filter(s => s.teacher_type === 'mixed').length || 0,
        expert: students?.filter(s => s.teacher_type === 'expert').length || 0,
      };

      // Financial metrics - match payment links with students
      const studentIdsWithPayment = new Set();
      let totalRevenue = 0;

      paymentLinks?.forEach(paymentLink => {
        if (paymentLink.student_ids && Array.isArray(paymentLink.student_ids)) {
          paymentLink.student_ids.forEach((studentId: string) => {
            studentIdsWithPayment.add(studentId);
          });
          totalRevenue += paymentLink.amount || 0;
        }
      });

      const paidStudentsCount = studentIdsWithPayment.size;

      // Session metrics
      const totalSessions = sessions?.length || 0;
      const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
      const scheduledSessions = sessions?.filter(s => s.status === 'scheduled').length || 0;
      const cancelledSessions = sessions?.filter(s => s.status === 'cancelled').length || 0;

      // Conversion rates
      const trialConversionRate = statusBreakdown.confirmed > 0 
        ? Math.round((statusBreakdown.trialCompleted / statusBreakdown.confirmed) * 100)
        : 0;
      
      const paymentConversionRate = statusBreakdown.trialCompleted > 0
        ? Math.round((statusBreakdown.paid / statusBreakdown.trialCompleted) * 100)
        : 0;

      const ghostRate = statusBreakdown.confirmed > 0
        ? Math.round(((students?.filter(s => s.status === 'trial-ghosted').length || 0) / statusBreakdown.confirmed) * 100)
        : 0;

      // Teacher utilization
      const bookedSlots = availability?.filter(a => a.is_booked).length || 0;
      const totalSlots = availability?.length || 0;
      const teacherUtilizationRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

      // Get unique teacher count
      const uniqueTeachers = new Set(students?.map(s => s.assigned_teacher_id).filter(Boolean));
      const avgStudentsPerTeacher = uniqueTeachers.size > 0 ? Math.round(totalStudents / uniqueTeachers.size) : 0;

      // Time-based calculations (simplified for now)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentStudents = students?.filter(s => new Date(s.created_at) >= thirtyDaysAgo).length || 0;
      const last30DaysGrowth = totalStudents > 0 ? Math.round((recentStudents / totalStudents) * 100) : 0;

      const calculatedMetrics: BusinessMetrics = {
        totalStudents,
        activeStudents: statusBreakdown.active,
        trialStudents: statusBreakdown.confirmed + statusBreakdown.trialCompleted,
        paidStudents: statusBreakdown.paid + statusBreakdown.active,
        expiredStudents: statusBreakdown.expired,
        statusBreakdown,
        teacherTypeBreakdown,
        totalRevenue,
        monthlyRecurringRevenue: Math.round(totalRevenue * 0.8), // Estimated MRR
        averageRevenuePerStudent: paidStudentsCount > 0 ? Math.round(totalRevenue / paidStudentsCount) : 0,
        outstandingPayments: statusBreakdown.awaitingPayment,
        trialConversionRate,
        paymentConversionRate,
        ghostRate,
        totalSessions,
        completedSessions,
        scheduledSessions,
        cancelledSessions,
        sessionCompletionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
        teacherUtilizationRate,
        avgStudentsPerTeacher,
        last30DaysGrowth,
        last7DaysActivity: Math.round(last30DaysGrowth * 0.3), // Estimated weekly activity
      };

      setMetrics(calculatedMetrics);
    } catch (err) {
      console.error('Error fetching business metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessMetrics();
  }, []);

  const refetchMetrics = () => {
    fetchBusinessMetrics();
  };

  return {
    metrics,
    loading,
    error,
    refetchMetrics
  };
};
