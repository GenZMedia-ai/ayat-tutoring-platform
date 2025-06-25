
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { toast } from 'sonner';
import { Bell, Settings, Send, History, CheckCircle, XCircle } from 'lucide-react';

const NotificationCenter = () => {
  const {
    testNotification,
    getNotificationLogs,
    getNotificationSettings,
    updateNotificationSetting
  } = useNotificationSystem();

  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    event_type: 'new_student_assignment',
    teacher_phone: '+201234567890',
    student_name: 'Test Student',
    trial_date: '2025-06-26',
    trial_time: '10:00 AM Egypt',
    student_age: '25',
    platform: 'Zoom',
    status: 'Pending'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, settingsData] = await Promise.all([
        getNotificationLogs(100),
        getNotificationSettings()
      ]);
      setLogs(logsData || []);
      setSettings(settingsData || []);
    } catch (error) {
      toast.error('Failed to load notification data');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await testNotification(testData.event_type, testData);
      await loadData(); // Refresh logs
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleUpdateSetting = async (settingKey: string, newValue: string) => {
    try {
      await updateNotificationSetting(settingKey, newValue);
      await loadData(); // Refresh settings
    } catch (error) {
      // Error already handled in hook
    }
  };

  const eventTypeOptions = [
    'new_student_assignment',
    'trial_completion_alert',
    'payment_confirmation',
    'confirmation_reminder_1_hour',
    'confirmation_reminder_3_hours',
    'pre_session_alert_1_hour',
    'pre_session_alert_15_minutes',
    'daily_session_list',
    'follow_up_reminder_15_minutes',
    'payment_received_notification',
    'unconfirmed_trial_alert_1_5_hours',
    'daily_follow_up_summary',
    'new_paid_student_alert'
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Notification Center</h1>
      </div>

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Notification Logs
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Test Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                View all sent notifications and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No notifications found
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{log.event_type}</Badge>
                          <Badge variant={log.success ? "default" : "destructive"}>
                            {log.success ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {log.success ? 'Sent' : 'Failed'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Recipient: {log.recipient_phone}</div>
                          <div>Type: {log.recipient_type}</div>
                          <div>Time: {new Date(log.sent_at).toLocaleString()}</div>
                          {log.error_message && (
                            <div className="text-red-600 mt-1">
                              Error: {log.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Timing Settings</CardTitle>
              <CardDescription>
                Configure when notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {settings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor={setting.setting_key} className="text-sm font-medium">
                        {setting.setting_key.replace(/_/g, ' ').toUpperCase()}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {setting.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id={setting.setting_key}
                        type="number"
                        value={setting.setting_value}
                        onChange={(e) => {
                          const newSettings = settings.map(s => 
                            s.id === setting.id 
                              ? { ...s, setting_value: e.target.value }
                              : s
                          );
                          setSettings(newSettings);
                        }}
                        className="w-20"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdateSetting(setting.setting_key, setting.setting_value)}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Notifications</CardTitle>
              <CardDescription>
                Send test notifications to verify the system is working
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="event_type">Event Type</Label>
                  <select
                    id="event_type"
                    value={testData.event_type}
                    onChange={(e) => setTestData({ ...testData, event_type: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    {eventTypeOptions.map(option => (
                      <option key={option} value={option}>
                        {option.replace(/_/g, ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="teacher_phone">Phone Number</Label>
                    <Input
                      id="teacher_phone"
                      value={testData.teacher_phone}
                      onChange={(e) => setTestData({ ...testData, teacher_phone: e.target.value })}
                      placeholder="+201234567890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="student_name">Student Name</Label>
                    <Input
                      id="student_name"
                      value={testData.student_name}
                      onChange={(e) => setTestData({ ...testData, student_name: e.target.value })}
                      placeholder="Test Student"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trial_date">Trial Date</Label>
                    <Input
                      id="trial_date"
                      type="date"
                      value={testData.trial_date}
                      onChange={(e) => setTestData({ ...testData, trial_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="platform">Platform</Label>
                    <select
                      id="platform"
                      value={testData.platform}
                      onChange={(e) => setTestData({ ...testData, platform: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="Zoom">Zoom</option>
                      <option value="Google Meet">Google Meet</option>
                    </select>
                  </div>
                </div>

                <Button onClick={handleTestNotification} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Notification
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationCenter;
