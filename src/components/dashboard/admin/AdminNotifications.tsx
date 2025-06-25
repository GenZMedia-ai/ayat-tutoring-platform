
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Bell, Clock, Users, Settings, Send, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string;
}

interface NotificationLog {
  id: string;
  notification_type: string;
  recipient_phone: string;
  recipient_name: string;
  recipient_role: string;
  status: string;
  sent_at: string;
  error_message: string;
  created_at: string;
}

const AdminNotifications: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadNotificationSettings();
    loadNotificationLogs();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to load notification settings",
        variant: "destructive",
      });
    }
  };

  const loadNotificationLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading notification logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingKey: string, newValue: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({ 
          setting_value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey);

      if (error) throw error;

      setSettings(prev => prev.map(setting => 
        setting.setting_key === settingKey 
          ? { ...setting, setting_value: newValue }
          : setting
      ));

      toast({
        title: "Success",
        description: "Notification setting updated successfully",
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update notification setting",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const sendTestNotification = async () => {
    if (!testPhone) {
      toast({
        title: "Error",
        description: "Please enter a phone number for testing",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('telegram-notifications', {
        body: {
          notification_type: 'system_config',
          recipient_phone: testPhone,
          recipient_name: 'Test User',
          recipient_role: 'admin',
          data: {
            config_change: 'Test notification from admin panel',
            old_value: 'N/A',
            new_value: 'Test',
            changed_by: 'Admin'
          },
          priority: 'low'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test notification sent successfully",
      });
      loadNotificationLogs(); // Refresh logs
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      sent: 'default',
      failed: 'destructive',
      pending: 'secondary',
      sending: 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading notification settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Notification Management</h2>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure timing and behavior for all notification types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.map((setting) => (
                <div key={setting.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={setting.setting_key} className="font-medium">
                        {setting.setting_key.replace(/_/g, ' ').toUpperCase()}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                    <div className="w-32">
                      {setting.setting_key.includes('enabled') ? (
                        <Switch
                          id={setting.setting_key}
                          checked={setting.setting_value === 'true'}
                          onCheckedChange={(checked) => 
                            updateSetting(setting.setting_key, checked ? 'true' : 'false')
                          }
                          disabled={updating}
                        />
                      ) : (
                        <Input
                          id={setting.setting_key}
                          value={setting.setting_value}
                          onChange={(e) => 
                            updateSetting(setting.setting_key, e.target.value)
                          }
                          disabled={updating}
                        />
                      )}
                    </div>
                  </div>
                  <Separator />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Notification Logs
                <Badge variant="outline">{logs.length} records</Badge>
              </CardTitle>
              <CardDescription>
                Recent notification delivery history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <div className="font-medium">
                          {log.notification_type.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          To: {log.recipient_name} ({log.recipient_role})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(log.status)}
                      {log.error_message && (
                        <div className="text-xs text-red-500 mt-1 max-w-48 truncate">
                          {log.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No notification logs found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Test Notifications
              </CardTitle>
              <CardDescription>
                Send test notifications to verify the system is working
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-phone">Test Phone Number</Label>
                <Input
                  id="test-phone"
                  placeholder="Enter phone number (e.g., +201234567890)"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
              </div>
              <Button onClick={sendTestNotification} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Test Notification
              </Button>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This will send a test system configuration notification to the specified phone number.
                  Make sure the phone number is in international format (e.g., +201234567890).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotifications;
