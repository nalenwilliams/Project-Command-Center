import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const ELEGANT_GOLD = '#C9A961';

const NotificationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState({
    admin_email: 'admin@williamsdiverse.com',
    smtp_server: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_from_email: '',
    notify_task_created: true,
    notify_file_upload: true,
    notify_status_change: true,
    notify_assignments: true,
    enabled: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/notification-settings');
      setSettings(response.data);
    } catch (error) {
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put('/admin/notification-settings', settings);
      setSettings(response.data);
      toast.success('Notification settings saved successfully');
    } catch (error) {
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!settings.enabled) {
      toast.error('Please enable notifications and save settings first');
      return;
    }
    
    setTesting(true);
    try {
      await api.post('/admin/test-notification');
      toast.success('Test email sent! Check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div style={{ color: ELEGANT_GOLD }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <CardHeader>
          <CardTitle style={{ color: ELEGANT_GOLD }} className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notification Settings
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure email notifications for task updates, file uploads, and assignments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Enable/Disable */}
          <div className="flex items-center justify-between p-4 border rounded-lg" style={{ borderColor: ELEGANT_GOLD, backgroundColor: 'rgba(201, 169, 97, 0.05)' }}>
            <div>
              <Label style={{ color: ELEGANT_GOLD }} className="text-lg">Enable Email Notifications</Label>
              <p className="text-sm text-gray-400 mt-1">Master switch for all email notifications</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>

          {/* Admin Email */}
          <div className="space-y-2">
            <Label htmlFor="admin_email" style={{ color: ELEGANT_GOLD }}>Admin Email Address</Label>
            <Input
              id="admin_email"
              type="email"
              value={settings.admin_email}
              onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
              className="bg-black border text-white"
              style={{ borderColor: ELEGANT_GOLD }}
              placeholder="admin@williamsdiverse.com"
            />
            <p className="text-xs text-gray-400">Email address to receive admin notifications</p>
          </div>

          {/* SMTP Configuration */}
          <div className="space-y-4 p-4 border rounded-lg" style={{ borderColor: ELEGANT_GOLD }}>
            <h3 className="font-semibold" style={{ color: ELEGANT_GOLD }}>Google Workspace SMTP Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_server" style={{ color: ELEGANT_GOLD }}>SMTP Server</Label>
                <Input
                  id="smtp_server"
                  value={settings.smtp_server}
                  onChange={(e) => setSettings({ ...settings, smtp_server: e.target.value })}
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                  placeholder="smtp.gmail.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp_port" style={{ color: ELEGANT_GOLD }}>SMTP Port</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  value={settings.smtp_port}
                  onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
                  className="bg-black border text-white"
                  style={{ borderColor: ELEGANT_GOLD }}
                  placeholder="587"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_username" style={{ color: ELEGANT_GOLD }}>SMTP Username (Email)</Label>
              <Input
                id="smtp_username"
                type="email"
                value={settings.smtp_username}
                onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
                className="bg-black border text-white"
                style={{ borderColor: ELEGANT_GOLD }}
                placeholder="admin@williamsdiverse.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_password" style={{ color: ELEGANT_GOLD }}>SMTP Password (App Password)</Label>
              <Input
                id="smtp_password"
                type="password"
                value={settings.smtp_password}
                onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                className="bg-black border text-white"
                style={{ borderColor: ELEGANT_GOLD }}
                placeholder="Enter Google App Password"
              />
              <p className="text-xs text-gray-400">
                Generate an App Password in Google Account → Security → 2-Step Verification → App passwords
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_from_email" style={{ color: ELEGANT_GOLD }}>From Email Address</Label>
              <Input
                id="smtp_from_email"
                type="email"
                value={settings.smtp_from_email}
                onChange={(e) => setSettings({ ...settings, smtp_from_email: e.target.value })}
                className="bg-black border text-white"
                style={{ borderColor: ELEGANT_GOLD }}
                placeholder="noreply@williamsdiverse.com"
              />
            </div>
          </div>

          {/* Notification Types */}
          <div className="space-y-4 p-4 border rounded-lg" style={{ borderColor: ELEGANT_GOLD }}>
            <h3 className="font-semibold" style={{ color: ELEGANT_GOLD }}>Notification Types</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label style={{ color: ELEGANT_GOLD }}>Task Created</Label>
                  <p className="text-xs text-gray-400">Notify admin when employees create new tasks</p>
                </div>
                <Switch
                  checked={settings.notify_task_created}
                  onCheckedChange={(checked) => setSettings({ ...settings, notify_task_created: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label style={{ color: ELEGANT_GOLD }}>File Uploads</Label>
                  <p className="text-xs text-gray-400">Notify admin when employees upload files/photos</p>
                </div>
                <Switch
                  checked={settings.notify_file_upload}
                  onCheckedChange={(checked) => setSettings({ ...settings, notify_file_upload: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label style={{ color: ELEGANT_GOLD }}>Status Changes</Label>
                  <p className="text-xs text-gray-400">Notify admin when task status changes</p>
                </div>
                <Switch
                  checked={settings.notify_status_change}
                  onCheckedChange={(checked) => setSettings({ ...settings, notify_status_change: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label style={{ color: ELEGANT_GOLD }}>Assignments</Label>
                  <p className="text-xs text-gray-400">Notify users when tasks/projects are assigned to them</p>
                </div>
                <Switch
                  checked={settings.notify_assignments}
                  onCheckedChange={(checked) => setSettings({ ...settings, notify_assignments: checked })}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="text-black hover:opacity-90"
              style={{ backgroundColor: ELEGANT_GOLD }}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            
            <Button
              onClick={handleTestEmail}
              disabled={testing || !settings.enabled}
              variant="outline"
              className="border text-white hover:bg-gray-800"
              style={{ borderColor: ELEGANT_GOLD }}
            >
              <Send className="mr-2 h-4 w-4" />
              {testing ? 'Sending...' : 'Send Test Email'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
