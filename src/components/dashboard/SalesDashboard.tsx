
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardNavigation from '@/components/shared/DashboardNavigation';

const SalesDashboard: React.FC = () => {
  const tabs = [
    { value: 'homepage', label: 'Home Page', path: '/sales/homepage' },
    { value: 'trials', label: 'Trial Appointments', path: '/sales/trials' },
    { value: 'payment-links', label: 'Payment Links', path: '/sales/payment-links' },
    { value: 'followup', label: 'Follow-up', path: '/sales/followup' },
    { value: 'students', label: 'Students', path: '/sales/students' },
    { value: 'analytics', label: 'Analytics', path: '/sales/analytics' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-primary">Sales Dashboard</h2>
            <Badge variant="outline" className="text-xs">
              Sales Agent Portal
            </Badge>
          </div>

          <DashboardNavigation tabs={tabs} gridCols="grid-cols-6" />
          
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SalesDashboard;
