
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useNotificationSystem = () => {
  useEffect(() => {
    // Set up real-time listener for notification logs to show admin notifications
    const channel = supabase
      .channel('notification-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_logs'
        },
        (payload) => {
          const notification = payload.new;
          
          // Show toast for failed notifications (admin monitoring)
          if (!notification.success) {
            toast.error(`Notification failed: ${notification.event_type}`, {
              description: notification.error_message,
              duration: 5000
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const testNotification = async (eventType: string, testData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('n8n-notification-sender', {
        body: {
          event_type: eventType,
          notification_data: testData
        }
      });

      if (error) throw error;

      toast.success('Test notification sent successfully');
      return data;
    } catch (error) {
      console.error('Test notification failed:', error);
      toast.error('Failed to send test notification');
      throw error;
    }
  };

  const getNotificationLogs = async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch notification logs:', error);
      throw error;
    }
  };

  const getNotificationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
      throw error;
    }
  };

  const updateNotificationSetting = async (settingKey: string, settingValue: string) => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .update({ setting_value: settingValue, updated_at: new Date().toISOString() })
        .eq('setting_key', settingKey)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Notification setting updated successfully');
      return data;
    } catch (error) {
      console.error('Failed to update notification setting:', error);
      toast.error('Failed to update notification setting');
      throw error;
    }
  };

  return {
    testNotification,
    getNotificationLogs,
    getNotificationSettings,
    updateNotificationSetting
  };
};
