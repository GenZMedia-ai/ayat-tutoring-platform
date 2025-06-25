
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { toast } from 'sonner';
import { Loader2, Send, Bell, Settings, MessageSquare, Phone, Check, X } from 'lucide-react';

const NotificationCenter = () => {
  const { 
    testNotification, 
    getNotificationLogs, 
    getNotificationSettings, 
    updateNotificationSetting,
    testEnhancedNotification 
  } = useNotificationSystem();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('+201234567890');
  const [testRecipientType, setTestRecipientType] = useState<'teacher' | 'sales' | 'supervisor'>('teacher');
  const [testStudentName, setTestStudentName] = useState('Test Student');

  useEffect(() => {
    loadNotificationLogs();
    loadNotificationSettings();
  }, []);

  const loadNotificationLogs = async () => {
    try {
      const data = await getNotificationLogs(50);
      setLogs(data || []);
    } catch (error) {
      toast.error('Failed to load notification logs');
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const data = await getNotificationSettings();
      setSettings(data || []);
    } catch (error) {
      toast.error('Failed to load notification settings');
    }
  };

  const handleTestEnhancedNotification = async () => {
    setIsLoading(true);
    try {
      await testEnhancedNotification(testPhone, testRecipientType, testStudentName);
      await loadNotificationLogs(); // Refresh logs
    } catch (error) {
      // Error already handled by the hook
    } finally {
      setIsLoading(false);
    }
  };

  const renderNotificationLog = (log: any) => {
    const notificationData = log.notification_data || {};
    const recipient = notificationData.recipient || {};
    const channels = notificationData.communication_channels || {};
    const studentData = notificationData.student_data || {};
    const context = notificationData.context || {};

    return (
      <Card key={log.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={log.success ? "default" : "destructive"}>
                {log.success ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                {log.event_type}
              </Badge>
              <Badge variant="outline">{log.recipient_type}</Badge>
              {channels.has_telegram && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Telegram
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {new Date(log.sent_at).toLocaleString()}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Enhanced Recipient Information */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Recipient Details
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Name:</strong> {recipient.full_name || 'Unknown'}</div>
                <div><strong>Role:</strong> {recipient.role || log.recipient_type}</div>
                <div><strong>Phone:</strong> {recipient.phone || log.recipient_phone}</div>
                <div><strong>Preferred Channel:</strong> {channels.preferred_channel || 'phone'}</div>
                {channels.telegram_chat_id && (
                  <div><strong>Telegram Chat:</strong> {channels.telegram_chat_id}</div>
                )}
                {channels.telegram_username && (
                  <div><strong>Telegram User:</strong> @{channels.telegram_username}</div>
                )}
              </div>
            </div>

            {/* Enhanced Student Information */}
            {studentData.student && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Student Context</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Student:</strong> {studentData.student.name}</div>
                  <div><strong>Age:</strong> {studentData.student.age}</div>
                  <div><strong>Status:</strong> {studentData.student.status}</div>
                  <div><strong>Platform:</strong> {studentData.student.platform}</div>
                  {studentData.family_data && (
                    <div><strong>Family Group:</strong> Yes ({studentData.family_data.student_count} students)</div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Context Information */}
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium mb-2">System Context</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Version:</strong> {context.notification_version || '1.0'}</div>
                <div><strong>System:</strong> {context.system_name || 'AyatWBian'}</div>
                <div><strong>Environment:</strong> {context.environment || 'production'}</div>
                <div><strong>Timezone:</strong> {context.timezone || 'UTC'}</div>
              </div>
            </div>

            {/* Error Information */}
            {!log.success && log.error_message && (
              <div className="bg-red-50 p-3 rounded-lg">
                <h4 className="font-medium mb-2 text-red-800">Error Details</h4>
                <p className="text-sm text-red-700">{log.error_message}</p>
              </div>
            )}

            {/* Notification ID */}
            <div className="text-xs text-muted-foreground">
              ID: {log.notification_id || log.id}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-6 h-6" />
        <h1 className="text-3xl font-bold">Enhanced Notification Center</h1>
        <Badge variant="secondary">v2.0 - With Telegram & Enriched Data</Badge>
      </div>

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs">Notification Logs</TabsTrigger>
          <TabsTrigger value="test">Test Enhanced Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Notification Logs</CardTitle>
              <CardDescription>
                Real-time notification history with enriched data including Telegram details and complete user profiles
              </CardDescription>
              <Button onClick={loadNotificationLogs} variant="outline" size="sm">
                Refresh Logs
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No notifications found</p>
                ) : (
                  logs.map(renderNotificationLog)
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test Enhanced Notifications</CardTitle>
              <CardDescription>
                Test the enhanced notification system with enriched data including Telegram details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="phone">Recipient Phone</Label>
                  <Input
                    id="phone"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+201234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Recipient Type</Label>
                  <select
                    id="type"
                    value={testRecipientType}
                    onChange={(e) => setTestRecipientType(e.target.value as any)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="sales">Sales Agent</option>
                    <option value="supervisor">Supervisor</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="student">Student Name</Label>
                  <Input
                    id="student"
                    value={testStudentName}
                    onChange={(e) => setTestStudentName(e.target.value)}
                    placeholder="Test Student"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleTestEnhancedNotification} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Enhanced Test Notification
              </Button>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Enhanced Test Features:</h4>
                <ul className="text-sm space-y-1 text-blue-800">
                  <li>✅ Complete recipient profile with Telegram details</li>
                  <li>✅ Smart communication channel detection</li>
                  <li>✅ Enriched student and relationship context</li>
                  <li>✅ Enhanced system metadata and versioning</li>
                  <li>✅ Automatic fallback for missing data</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure notification timing and behavior settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <Label className="font-medium">{setting.setting_key}</Label>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <div className="w-24">
                      <Input
                        value={setting.setting_value}
                        onChange={(e) => {
                          const updatedSettings = settings.map(s => 
                            s.id === setting.id ? { ...s, setting_value: e.target.value } : s
                          );
                          setSettings(updatedSettings);
                        }}
                        onBlur={() => updateNotificationSetting(setting.setting_key, setting.setting_value)}
                        className="text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationCenter;
