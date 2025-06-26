
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemConfig {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string;
}

interface ConfigCategories {
  teacherManagement: SystemConfig[];
  notificationTiming: SystemConfig[];
  businessRules: SystemConfig[];
}

export const useSystemConfiguration = () => {
  const [config, setConfig] = useState<ConfigCategories>({
    teacherManagement: [],
    notificationTiming: [],
    businessRules: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfiguration = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;

      const settings = data || [];
      
      // Categorize settings
      const teacherManagement = settings.filter(s => 
        s.setting_key.includes('teacher') || s.setting_key.includes('capacity')
      );
      
      const notificationTiming = settings.filter(s => 
        s.setting_key.includes('notification') || s.setting_key.includes('reminder')
      );
      
      const businessRules = settings.filter(s => 
        !s.setting_key.includes('teacher') && 
        !s.setting_key.includes('capacity') &&
        !s.setting_key.includes('notification') && 
        !s.setting_key.includes('reminder')
      );

      setConfig({
        teacherManagement,
        notificationTiming,
        businessRules
      });

    } catch (error) {
      console.error('Error fetching system configuration:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch configuration');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (id: string, newValue: string) => {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({ 
          setting_value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // Refresh configuration
      await fetchConfiguration();
      return true;
    } catch (error) {
      console.error('Error updating setting:', error);
      return false;
    }
  };

  const createSetting = async (settingKey: string, settingValue: string, description: string) => {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .insert({
          setting_key: settingKey,
          setting_value: settingValue,
          description: description
        });

      if (error) throw error;
      
      await fetchConfiguration();
      return true;
    } catch (error) {
      console.error('Error creating setting:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchConfiguration();
  }, []);

  return {
    config,
    loading,
    error,
    updateSetting,
    createSetting,
    refetch: fetchConfiguration
  };
};
