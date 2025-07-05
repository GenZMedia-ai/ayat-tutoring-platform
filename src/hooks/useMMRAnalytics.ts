import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MMRAnalytics {
  totalMRR: number;
  newCustomerMRR: number;
  renewalMRR: number;
  churnMRR: number;
  netMRRGrowth: number;
  renewalRate: number;
  calculatedAt: string;
}

export const useMMRAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<MMRAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMMRAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_mmr_analytics', {
        p_sales_agent_id: user.id
      });

      if (error) {
        console.error('❌ Error fetching MMR analytics:', error);
        return;
      }

      const analyticsData = data as any;
      setAnalytics({
        totalMRR: analyticsData.total_mrr || 0,
        newCustomerMRR: analyticsData.new_customer_mrr || 0,
        renewalMRR: analyticsData.renewal_mrr || 0,
        churnMRR: analyticsData.churn_mrr || 0,
        netMRRGrowth: analyticsData.net_mrr_growth || 0,
        renewalRate: analyticsData.renewal_rate || 0,
        calculatedAt: analyticsData.calculated_at
      });
    } catch (error) {
      console.error('❌ Error in fetchMMRAnalytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMMRAnalytics();
  }, [user]);

  return {
    analytics,
    loading,
    refreshAnalytics: fetchMMRAnalytics
  };
};