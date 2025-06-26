
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useSystemConfiguration } from '@/hooks/useSystemConfiguration';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Clock, 
  Users, 
  Save, 
  Plus, 
  AlertCircle,
  CheckCircle,
  Bell
} from 'lucide-react';

const SystemConfigurationPanel: React.FC = () => {
  const { config, loading, error, updateSetting, createSetting } = useSystemConfiguration();
  const { toast } = useToast();
  const [editingSettings, setEditingSettings] = useState<{ [key: string]: string }>({});
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    description: '',
    category: 'businessRules'
  });
  const [showNewSetting, setShowNewSetting] = useState(false);

  const handleSettingChange = (id: string, value: string) => {
    setEditingSettings(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveSetting = async (id: string, originalValue: string) => {
    const newValue = editingSettings[id];
    if (!newValue || newValue === originalValue) return;

    const success = await updateSetting(id, newValue);
    if (success) {
      toast({
        title: "Setting Updated",
        description: "Configuration has been saved successfully.",
      });
      setEditingSettings(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } else {
      toast({
        title: "Update Failed",
        description: "Failed to update the setting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateSetting = async () => {
    if (!newSetting.key || !newSetting.value) {
      toast({
        title: "Missing Information",
        description: "Please provide both key and value for the new setting.",
        variant: "destructive",
      });
      return;
    }

    const success = await createSetting(newSetting.key, newSetting.value, newSetting.description);
    if (success) {
      toast({
        title: "Setting Created",
        description: "New configuration setting has been added successfully.",
      });
      setNewSetting({ key: '', value: '', description: '', category: 'businessRules' });
      setShowNewSetting(false);
    } else {
      toast({
        title: "Creation Failed",
        description: "Failed to create the new setting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderSettingsSection = (title: string, settings: any[], icon: React.ReactNode, description: string) => (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No settings configured in this category</p>
          </div>
        ) : (
          settings.map((setting) => (
            <div key={setting.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">{setting.setting_key}</h4>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {setting.setting_key.includes('notification') ? 'Notification' : 
                   setting.setting_key.includes('teacher') ? 'Teacher' : 'Business'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  value={editingSettings[setting.id] ?? setting.setting_value}
                  onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                  placeholder="Setting value"
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSaveSetting(setting.id, setting.setting_value)}
                  disabled={!editingSettings[setting.id] || editingSettings[setting.id] === setting.setting_value}
                  size="sm"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Error loading system configuration: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Overview */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration Overview
          </CardTitle>
          <CardDescription>
            Manage all system settings and operational parameters in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {config.teacherManagement.length}
              </div>
              <p className="text-sm text-muted-foreground">Teacher Settings</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {config.notificationTiming.length}
              </div>
              <p className="text-sm text-muted-foreground">Notification Settings</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {config.businessRules.length}
              </div>
              <p className="text-sm text-muted-foreground">Business Rules</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Sections */}
      {renderSettingsSection(
        "Teacher Management Settings",
        config.teacherManagement,
        <Users className="h-5 w-5" />,
        "Configure teacher capacity, supervisor ratios, and management parameters"
      )}

      {renderSettingsSection(
        "Notification Timing Settings",
        config.notificationTiming,
        <Bell className="h-5 w-5" />,
        "Manage timing for all Telegram notifications and reminders sent through N8N"
      )}

      {renderSettingsSection(
        "Business Rules",
        config.businessRules,
        <Settings className="h-5 w-5" />,
        "Configure operational parameters and business logic settings"
      )}

      {/* Add New Setting */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Setting
            </span>
            <Button
              onClick={() => setShowNewSetting(!showNewSetting)}
              variant="outline"
              size="sm"
            >
              {showNewSetting ? 'Cancel' : 'Add Setting'}
            </Button>
          </CardTitle>
        </CardHeader>
        {showNewSetting && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Setting Key</label>
                <Input
                  value={newSetting.key}
                  onChange={(e) => setNewSetting(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="e.g., max_students_per_teacher"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Setting Value</label>
                <Input
                  value={newSetting.value}
                  onChange={(e) => setNewSetting(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="e.g., 10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newSetting.description}
                onChange={(e) => setNewSetting(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this setting controls..."
                rows={3}
              />
            </div>
            <Button onClick={handleCreateSetting} className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Create Setting
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Configuration Notes */}
      <Card className="dashboard-card border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900">Configuration Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All changes apply immediately without requiring code deployment</li>
                <li>• Notification settings control timing for N8N webhook integrations</li>
                <li>• Teacher management settings affect capacity and assignment logic</li>
                <li>• Use descriptive keys following snake_case convention</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemConfigurationPanel;
