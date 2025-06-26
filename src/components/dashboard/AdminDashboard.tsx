
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardNavigation from '@/components/shared/DashboardNavigation';

const AdminDashboard: React.FC = () => {
  const tabs = [
    { value: 'homepage', label: 'Command Center', path: '/admin/homepage' },
    { value: 'user-management', label: 'User Management', path: '/admin/user-management' },
    { value: 'analytics', label: 'Business Intelligence', path: '/admin/analytics' },
    { value: 'configuration', label: 'System Config', path: '/admin/configuration' },
    { value: 'trials', label: 'Trial Management', path: '/admin/trials' },
    { value: 'students', label: 'Student Records', path: '/admin/students' },
    { value: 'sessions', label: 'Session Oversight', path: '/admin/sessions' },
    { value: 'notifications', label: 'Notifications', path: '/admin/notifications' },
    { value: 'settings', label: 'Advanced Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-primary">Administrative Dashboard</h2>
            <Badge variant="outline" className="text-xs px-3 py-1">
              🔒 Administrator Access • Full System Control
            </Badge>
          </div>

          <DashboardNavigation tabs={tabs} gridCols="grid-cols-9" />
          
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
