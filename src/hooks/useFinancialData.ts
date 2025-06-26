
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

// Static exchange rates (same as useExchangeRates)
const EXCHANGE_RATES: { [key: string]: number } = {
  USD: 1.00,
  EUR: 0.85,
  GBP: 0.73,
  EGP: 30.50,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38
};

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
  const [error, setError] = useState<string | null>(null);

  // Local conversion function to avoid circular dependency
  const convertToUSD = (amount: number, currency: string): number => {
    if (!amount || amount === 0) return 0;
    
    const currencyCode = currency.toUpperCase();
    if (currencyCode === 'USD') return amount;
    
    const rate = EXCHANGE_RATES[currencyCode];
    if (!rate) {
      console.warn(`No exchange rate found for ${currencyCode}`);
      return amount;
    }
    
    return amount / rate;
  };

  const calculateStripeFee = (amount: number, currency: string): number => {
    const amountUSD = convertToUSD(amount, currency);
    return (amountUSD * 0.029) + 0.30;
  };

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching payment links...');
      
      // Fetch all paid payment links
      const { data: paymentLinks, error: paymentError } = await supabase
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

      if (paymentError) {
        console.error('Payment links error:', paymentError);
        throw paymentError;
      }

      console.log('Payment links fetched:', paymentLinks?.length || 0);

      if (!paymentLinks || paymentLinks.length === 0) {
        console.log('No paid payment links found');
        setTransactions([]);
        setMetrics({
          totalRevenueUSD: 0,
          stripeFees: 0,
          teacherCosts: 0,
          netProfit: 0,
          transactionCount: 0,
          monthlyGrowth: 0,
          averageTransactionSize: 0
        });
        return;
      }

      const transactionDetails: TransactionDetail[] = [];
      let totalRevenueUSD = 0;
      let totalStripeFees = 0;

      // Process each payment link
      for (const link of paymentLinks) {
        try {
          const amount = Number(link.amount) || 0;
          const currency = link.currency || 'USD';
          
          const amountUSD = convertToUSD(amount, currency);
          const stripeFee = calculateStripeFee(amount, currency);
          
          totalRevenueUSD += amountUSD;
          totalStripeFees += stripeFee;

          // Get student names
          let studentNames = 'Unknown';
          if (link.student_ids && link.student_ids.length > 0) {
            const { data: students } = await supabase
              .from('students')
              .select('id, name')
              .in('id', link.student_ids);

            if (students && students.length > 0) {
              studentNames = students.map(s => s.name).join(', ');
            }
          }

          transactionDetails.push({
            id: link.id,
            amount: amount,
            currency: currency,
            amountUSD: amountUSD,
            stripeFee: stripeFee,
            studentName: studentNames,
            studentId: link.student_ids?.[0] || '',
            paymentDate: link.paid_at || new Date().toISOString(),
            status: link.status,
            paymentType: link.payment_type || 'single_student'
          });
        } catch (linkError) {
          console.error('Error processing payment link:', link.id, linkError);
        }
      }

      console.log('Processed transactions:', transactionDetails.length);
      console.log('Total revenue USD:', totalRevenueUSD);

      // Calculate teacher costs
      let teacherCostsUSD = 0;
      try {
        const { data: completedSessions } = await supabase
          .from('sessions')
          .select('actual_minutes')
          .eq('status', 'completed')
          .not('actual_minutes', 'is', null);

        if (completedSessions && completedSessions.length > 0) {
          const totalMinutes = completedSessions.reduce((sum, session) => sum + (session.actual_minutes || 0), 0);
          const totalHours = totalMinutes / 60;
          const teacherCostsEGP = totalHours * 100; // 100 EGP per hour
          teacherCostsUSD = convertToUSD(teacherCostsEGP, 'EGP');
        }
      } catch (sessionError) {
        console.error('Error calculating teacher costs:', sessionError);
      }

      // Calculate monthly growth
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
      const averageTransactionSize = transactionDetails.length > 0 ? totalRevenueUSD / transactionDetails.length : 0;

      const finalMetrics = {
        totalRevenueUSD,
        stripeFees: totalStripeFees,
        teacherCosts: teacherCostsUSD,
        netProfit,
        transactionCount: transactionDetails.length,
        monthlyGrowth,
        averageTransactionSize
      };

      console.log('Final metrics:', finalMetrics);

      setMetrics(finalMetrics);
      setTransactions(transactionDetails);

    } catch (error) {
      console.error('Error fetching financial data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  return {
    metrics,
    transactions,
    loading,
    error,
    refetch: fetchFinancialData
  };
};
