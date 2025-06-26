
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useExchangeRates } from './useExchangeRates';

interface FinancialMetrics {
  totalRevenueUSD: number;
  stripeFees: number;
  teacherCosts: number;
  netProfit: number;
  transactionCount: number;
  monthlyGrowth: number;
  averageTransactionSize: number;
}

interface TransactionDetail {
  id: string;
  amount: number;
  currency: string;
  amountUSD: number;
  stripeFee: number;
  studentName: string;
  studentId: string;
  paymentDate: string;
  status: string;
  paymentType: string;
}

export const useFinancialData = () => {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenueUSD: 0,
    stripeFees: 0,
    teacherCosts: 0,
    netProfit: 0,
    transactionCount: 0,
    monthlyGrowth: 0,
    averageTransactionSize: 0
  });
  
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const { convertToUSD } = useExchangeRates();

  const calculateStripeFee = (amount: number, currency: string): number => {
    // Convert to USD for fee calculation
    const amountUSD = convertToUSD(amount, currency);
    // Stripe fee: 2.9% + $0.30
    return (amountUSD * 0.029) + 0.30;
  };

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch all paid payment links with student details
      const { data: paymentLinks, error } = await supabase
        .from('payment_links')
        .select(`
          id,
          amount,
          currency,
          paid_at,
          status,
          payment_type,
          student_ids
        `)
        .eq('status', 'paid')
        .order('paid_at', { ascending: false });

      if (error) throw error;

      // Fetch student names for transactions
      const transactionDetails: TransactionDetail[] = [];
      let totalRevenueUSD = 0;
      let totalStripeFees = 0;

      for (const link of paymentLinks || []) {
        const amountUSD = convertToUSD(link.amount, link.currency);
        const stripeFee = calculateStripeFee(link.amount, link.currency);
        
        totalRevenueUSD += amountUSD;
        totalStripeFees += stripeFee;

        // Get student names
        const { data: students } = await supabase
          .from('students')
          .select('id, name')
          .in('id', link.student_ids);

        const studentNames = students?.map(s => s.name).join(', ') || 'Unknown';

        transactionDetails.push({
          id: link.id,
          amount: link.amount,
          currency: link.currency,
          amountUSD,
          stripeFee,
          studentName: studentNames,
          studentId: link.student_ids[0] || '',
          paymentDate: link.paid_at || '',
          status: link.status,
          paymentType: link.payment_type || 'single_student'
        });
      }

      // Calculate teacher costs (100 EGP per hour taught)
      const { data: completedSessions } = await supabase
        .from('sessions')
        .select('actual_minutes')
        .eq('status', 'completed')
        .not('actual_minutes', 'is', null);

      const totalMinutes = completedSessions?.reduce((sum, session) => sum + (session.actual_minutes || 0), 0) || 0;
      const totalHours = totalMinutes / 60;
      const teacherCostsEGP = totalHours * 100;
      const teacherCostsUSD = convertToUSD(teacherCostsEGP, 'EGP');

      // Calculate previous month for growth
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const currentMonthRevenue = transactionDetails
        .filter(t => {
          const date = new Date(t.paymentDate);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amountUSD, 0);

      const lastMonthRevenue = transactionDetails
        .filter(t => {
          const date = new Date(t.paymentDate);
          return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
        })
        .reduce((sum, t) => sum + t.amountUSD, 0);

      const monthlyGrowth = lastMonthRevenue > 0 
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      const netProfit = totalRevenueUSD - totalStripeFees - teacherCostsUSD;

      setMetrics({
        totalRevenueUSD,
        stripeFees: totalStripeFees,
        teacherCosts: teacherCostsUSD,
        netProfit,
        transactionCount: transactionDetails.length,
        monthlyGrowth,
        averageTransactionSize: transactionDetails.length > 0 ? totalRevenueUSD / transactionDetails.length : 0
      });

      setTransactions(transactionDetails);

    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [convertToUSD]);

  return {
    metrics,
    transactions,
    loading,
    refetch: fetchFinancialData
  };
};
