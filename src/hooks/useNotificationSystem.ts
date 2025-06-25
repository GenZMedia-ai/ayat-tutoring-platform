
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useNotificationSystem = () => {
  useEffect(() => {
    console.log('🔔 Setting up notification system real-time listener');
    
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
          console.log('📨 Real-time notification received:', notification);
          
          // Show toast for failed notifications (admin monitoring)
          if (!notification.success) {
            toast.error(`Notification failed: ${notification.event_type}`, {
              description: notification.error_message,
              duration: 5000
            });
          } else {
            // Show success toast for successful notifications
            toast.success(`Notification sent: ${notification.event_type}`, {
              description: `Sent to ${notification.recipient_phone}`,
              duration: 3000
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Notification channel status:', status);
      });

    return () => {
      console.log('🔔 Cleaning up notification system listener');
      supabase.removeChannel(channel);
    };
  }, []);

  const testNotification = async (eventType: string, testData: any) => {
    try {
      console.log('🧪 Testing notification:', { eventType, testData });
      
      const { data, error } = await supabase.functions.invoke('n8n-notification-sender', {
        body: {
          event_type: eventType,
          notification_data: testData
        }
      });

      if (error) {
        console.error('❌ Test notification error:', error);
        throw error;
      }

      console.log('✅ Test notification response:', data);
      toast.success('Test notification sent successfully');
      return data;
    } catch (error) {
      console.error('❌ Test notification failed:', error);
      toast.error('Failed to send test notification');
      throw error;
    }
  };

  const getNotificationLogs = async (limit = 50) => {
    try {
      console.log('📋 Fetching notification logs, limit:', limit);
      
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Failed to fetch notification logs:', error);
        throw error;
      }
      
      console.log('✅ Fetched notification logs:', data?.length || 0, 'records');
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch notification logs:', error);
      throw error;
    }
  };

  const getNotificationSettings = async () => {
    try {
      console.log('⚙️ Fetching notification settings');
      
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .order('setting_key');

      if (error) {
        console.error('❌ Failed to fetch notification settings:', error);
        throw error;
      }
      
      console.log('✅ Fetched notification settings:', data?.length || 0, 'settings');
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch notification settings:', error);
      throw error;
    }
  };

  const updateNotificationSetting = async (settingKey: string, settingValue: string) => {
    try {
      console.log('⚙️ Updating notification setting:', { settingKey, settingValue });
      
      const { data, error } = await supabase
        .from('notification_settings')
        .update({ setting_value: settingValue, updated_at: new Date().toISOString() })
        .eq('setting_key', settingKey)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update notification setting:', error);
        throw error;
      }
      
      console.log('✅ Updated notification setting:', data);
      toast.success('Notification setting updated successfully');
      return data;
    } catch (error) {
      console.error('❌ Failed to update notification setting:', error);
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
