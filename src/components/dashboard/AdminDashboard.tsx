
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardNavigation from '@/components/shared/DashboardNavigation';

const AdminDashboard: React.FC = () => {
  const tabs = [
    { value: 'homepage', label: 'Homepage', path: '/admin/homepage' },
    { value: 'trials', label: 'Trial Appointments', path: '/admin/trials' },
    { value: 'students', label: 'Students', path: '/admin/students' },
    { value: 'sessions', label: 'Sessions', path: '/admin/sessions' },
    { value: 'payment-links', label: 'Payment Links', path: '/admin/payment-links' },
    { value: 'followup', label: 'Follow-up', path: '/admin/followup' },
    { value: 'availability', label: 'Availability', path: '/admin/availability' },
    { value: 'revenue', label: 'Revenue', path: '/admin/revenue' },
    { value: 'settings', label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-primary">Admin Dashboard</h2>
            <Badge variant="outline" className="text-xs">
              Administrator Access
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
