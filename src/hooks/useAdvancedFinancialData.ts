
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdvancedFinancialMetrics {
  totalRevenueUSD: number;
  stripeFees: number;
  teacherCosts: number;
  netProfit: number;
  profitMargin: number;
  transactionCount: number;
  monthlyGrowth: number;
  averageTransactionSize: number;
  revenueByMonth: { month: string; revenue: number; }[];
  conversionRate: number;
  teacherUtilization: number;
}

interface SystemMetrics {
  totalUsers: number;
  activeTeachers: number;
  totalSessions: number;
  completedSessions: number;
  pendingApprovals: number;
  activePackages: number;
  enabledCurrencies: number;
}

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

export const useAdvancedFinancialData = () => {
  const [metrics, setMetrics] = useState<AdvancedFinancialMetrics>({
    totalRevenueUSD: 0,
    stripeFees: 0,
    teacherCosts: 0,
    netProfit: 0,
    profitMargin: 0,
    transactionCount: 0,
    monthlyGrowth: 0,
    averageTransactionSize: 0,
    revenueByMonth: [],
    conversionRate: 0,
    teacherUtilization: 0
  });

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeTeachers: 0,
    totalSessions: 0,
    completedSessions: 0,
    pendingApprovals: 0,
    activePackages: 0,
    enabledCurrencies: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const convertToUSD = (amount: number, currency: string): number => {
    if (!amount || amount === 0) return 0;
    const currencyCode = currency.toUpperCase();
    if (currencyCode === 'USD') return amount;
    const rate = EXCHANGE_RATES[currencyCode];
    return rate ? amount / rate : amount;
  };

  const calculateStripeFee = (amount: number, currency: string): number => {
    const amountUSD = convertToUSD(amount, currency);
    return (amountUSD * 0.029) + 0.30;
  };

  const fetchAdvancedFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch payment data
      const { data: paymentLinks, error: paymentError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('status', 'paid')
        .order('paid_at', { ascending: false });

      if (paymentError) throw paymentError;

      // Calculate financial metrics
      let totalRevenueUSD = 0;
      let totalStripeFees = 0;
      const revenueByMonth: { [key: string]: number } = {};

      paymentLinks?.forEach(link => {
        const amount = Number(link.amount) || 0;
        const currency = link.currency || 'USD';
        const amountUSD = convertToUSD(amount, currency);
        const stripeFee = calculateStripeFee(amount, currency);

        totalRevenueUSD += amountUSD;
        totalStripeFees += stripeFee;

        // Group by month
        if (link.paid_at) {
          const month = new Date(link.paid_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          });
          revenueByMonth[month] = (revenueByMonth[month] || 0) + amountUSD;
        }
      });

      // Calculate teacher costs
      const { data: completedSessions } = await supabase
        .from('sessions')
        .select('actual_minutes')
        .eq('status', 'completed')
        .not('actual_minutes', 'is', null);

      const totalMinutes = completedSessions?.reduce((sum, session) => 
        sum + (session.actual_minutes || 0), 0) || 0;
      const totalHours = totalMinutes / 60;
      const teacherCostsEGP = totalHours * 100; // 100 EGP per hour
      const teacherCostsUSD = convertToUSD(teacherCostsEGP, 'EGP');

      // Calculate metrics
      const netProfit = totalRevenueUSD - totalStripeFees - teacherCostsUSD;
      const profitMargin = totalRevenueUSD > 0 ? (netProfit / totalRevenueUSD) * 100 : 0;
      const averageTransactionSize = paymentLinks?.length ? totalRevenueUSD / paymentLinks.length : 0;

      // Calculate monthly growth
      const monthlyData = Object.entries(revenueByMonth)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => new Date(a.month + ' 1').getTime() - new Date(b.month + ' 1').getTime());

      const monthlyGrowth = monthlyData.length >= 2 ? 
        ((monthlyData[monthlyData.length - 1].revenue - monthlyData[monthlyData.length - 2].revenue) / 
         monthlyData[monthlyData.length - 2].revenue) * 100 : 0;

      // Fetch system metrics
      const [usersResult, sessionsResult, packagesResult, currenciesResult] = await Promise.all([
        supabase.from('profiles').select('id, status, role'),
        supabase.from('sessions').select('id, status'),
        supabase.from('packages').select('id, is_active'),
        supabase.from('currencies').select('id, is_enabled')
      ]);

      const users = usersResult.data || [];
      const sessions = sessionsResult.data || [];
      const packages = packagesResult.data || [];
      const currencies = currenciesResult.data || [];

      // Calculate conversion rate (trial outcomes to payments)
      const { data: trialOutcomes } = await supabase
        .from('trial_outcomes')
        .select('outcome');

      const positiveOutcomes = trialOutcomes?.filter(t => 
        t.outcome === 'interested' || t.outcome === 'very_interested').length || 0;
      const conversionRate = trialOutcomes?.length ? 
        (paymentLinks?.length || 0) / trialOutcomes.length * 100 : 0;

      // Calculate teacher utilization
      const activeTeachers = users.filter(u => u.role === 'teacher' && u.status === 'approved').length;
      const teacherUtilization = activeTeachers > 0 ? 
        (completedSessions?.length || 0) / (activeTeachers * 10) * 100 : 0; // Assuming 10 sessions capacity per teacher

      setMetrics({
        totalRevenueUSD,
        stripeFees: totalStripeFees,
        teacherCosts: teacherCostsUSD,
        netProfit,
        profitMargin,
        transactionCount: paymentLinks?.length || 0,
        monthlyGrowth,
        averageTransactionSize,
        revenueByMonth: monthlyData,
        conversionRate,
        teacherUtilization
      });

      setSystemMetrics({
        totalUsers: users.length,
        activeTeachers,
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        pendingApprovals: users.filter(u => u.status === 'pending').length,
        activePackages: packages.filter(p => p.is_active).length,
        enabledCurrencies: currencies.filter(c => c.is_enabled).length
      });

    } catch (error) {
      console.error('Error fetching advanced financial data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvancedFinancialData();
  }, []);

  return {
    metrics,
    systemMetrics,
    loading,
    error,
    refetch: fetchAdvancedFinancialData
  };
};
