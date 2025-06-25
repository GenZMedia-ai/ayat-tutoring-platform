
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useNotificationSystem = () => {
  useEffect(() => {
    console.log('🔔 Setting up enhanced notification system real-time listener');
    
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
          console.log('📨 Enhanced real-time notification received:', notification);
          
          // Parse enriched notification data
          const notificationData = notification.notification_data || {};
          const recipient = notificationData.recipient || {};
          const communicationChannels = notificationData.communication_channels || {};
          const studentData = notificationData.student_data || {};
          
          // Show enhanced toast notifications with Telegram and enriched context
          if (!notification.success) {
            toast.error(`Notification failed: ${notification.event_type}`, {
              description: `${notification.error_message} | Recipient: ${recipient.full_name || 'Unknown'}`,
              duration: 5000
            });
          } else {
            // Show success toast with enriched information
            const description = `Sent to ${recipient.full_name || 'Unknown'} via ${communicationChannels.preferred_channel || 'phone'}${
              communicationChannels.has_telegram ? ' (Telegram available)' : ''
            }`;
            
            toast.success(`Enhanced notification sent: ${notification.event_type}`, {
              description,
              duration: 3000
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Enhanced notification channel status:', status);
      });

    return () => {
      console.log('🔔 Cleaning up enhanced notification system listener');
      supabase.removeChannel(channel);
    };
  }, []);

  const testNotification = async (eventType: string, testData: any) => {
    try {
      console.log('🧪 Testing enhanced notification:', { eventType, testData });
      
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

      console.log('✅ Enhanced test notification response:', data);
      toast.success('Enhanced test notification sent successfully', {
        description: `Includes ${data.enriched_data_available ? 'full profile data with Telegram details' : 'basic data only'}`
      });
      return data;
    } catch (error) {
      console.error('❌ Test notification failed:', error);
      toast.error('Failed to send test notification');
      throw error;
    }
  };

  const getNotificationLogs = async (limit = 50) => {
    try {
      console.log('📋 Fetching enhanced notification logs, limit:', limit);
      
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Failed to fetch notification logs:', error);
        throw error;
      }
      
      console.log('✅ Fetched enhanced notification logs:', data?.length || 0, 'records');
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

  const testEnhancedNotification = async (recipientPhone: string, recipientType: 'teacher' | 'sales' | 'supervisor', studentName?: string) => {
    try {
      console.log('🧪 Testing enhanced notification with enriched data');
      
      const testPayload = {
        recipient_type: recipientType,
        [`${recipientType}_phone`]: recipientPhone,
        student_name: studentName || 'Test Student',
        test_notification: true,
        enhanced_features_test: true
      };

      return await testNotification('enhanced_test_notification', testPayload);
    } catch (error) {
      console.error('❌ Enhanced test notification failed:', error);
      throw error;
    }
  };

  return {
    testNotification,
    getNotificationLogs,
    getNotificationSettings,
    updateNotificationSetting,
    testEnhancedNotification
  };
};
