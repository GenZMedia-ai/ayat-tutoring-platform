
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ServerDateInfo {
  currentDate: string; // YYYY-MM-DD format
  timezone: string;
  timestamp: string;
}

export const useServerDate = () => {
  const [serverDate, setServerDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServerDate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🌍 Fetching authoritative server date...');
      
      const { data, error: fnError } = await supabase.functions.invoke('get-server-date');
      
      if (fnError) {
        console.error('❌ Error fetching server date:', fnError);
        throw fnError;
      }

      const serverDateInfo: ServerDateInfo = data;
      console.log('✅ Server date received:', serverDateInfo);
      
      setServerDate(serverDateInfo.currentDate);
    } catch (err) {
      console.error('❌ Failed to fetch server date:', err);
      setError('Failed to get server date');
      // Fallback to local date (with warning)
      const fallbackDate = format(new Date(), 'yyyy-MM-dd');
      console.warn('⚠️ Using fallback local date:', fallbackDate);
      setServerDate(fallbackDate);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerDate();
  }, []);

  const isDateToday = (date: Date | undefined): boolean => {
    if (!date || !serverDate) return false;
    const selectedDateStr = format(date, 'yyyy-MM-dd');
    const isToday = selectedDateStr === serverDate;
    console.log('📅 Date comparison:', { selectedDateStr, serverDate, isToday });
    return isToday;
  };

  return {
    serverDate,
    loading,
    error,
    isDateToday,
    refreshServerDate: fetchServerDate,
  };
};
