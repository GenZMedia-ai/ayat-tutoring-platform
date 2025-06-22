
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  is_enabled: boolean;
  created_at: string;
}

export const useCurrencyManagement = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('code');

      if (error) throw error;
      setCurrencies(data || []);
    } catch (error) {
      console.error('Error fetching currencies:', error);
      toast.error('Failed to fetch currencies');
    } finally {
      setLoading(false);
    }
  };

  const updateCurrencyStatus = async (id: string, is_enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('currencies')
        .update({ is_enabled })
        .eq('id', id);

      if (error) throw error;
      
      await fetchCurrencies();
      toast.success(`Currency ${is_enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error updating currency:', error);
      toast.error('Failed to update currency');
      throw error;
    }
  };

  const createCurrency = async (currencyData: Omit<Currency, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('currencies')
        .insert([currencyData])
        .select()
        .single();

      if (error) throw error;
      
      await fetchCurrencies();
      toast.success('Currency created successfully');
      return data;
    } catch (error) {
      console.error('Error creating currency:', error);
      toast.error('Failed to create currency');
      throw error;
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  return {
    currencies,
    loading,
    updateCurrencyStatus,
    createCurrency,
    refetch: fetchCurrencies
  };
};
