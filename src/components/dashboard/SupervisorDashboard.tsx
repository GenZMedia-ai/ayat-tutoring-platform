
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardNavigation from '@/components/shared/DashboardNavigation';

const SupervisorDashboard: React.FC = () => {
  const tabs = [
    { value: 'homepage', label: 'Homepage', path: '/supervisor/homepage' },
    { value: 'alerts', label: 'Alerts', path: '/supervisor/alerts' },
    { value: 'team', label: 'Team Management', path: '/supervisor/team' },
    { value: 'quality', label: 'Quality Control', path: '/supervisor/quality' },
    { value: 'reassignment', label: 'Reassignment', path: '/supervisor/reassignment' },
    { value: 'students', label: 'Students', path: '/supervisor/students' },
    { value: 'sessions', label: 'Sessions', path: '/supervisor/sessions' },
    { value: 'analysis', label: 'Analysis', path: '/supervisor/analysis' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-primary">Supervisor Dashboard</h2>
            <Badge variant="outline" className="text-xs">
              Supervisor Access
            </Badge>
          </div>

          <DashboardNavigation tabs={tabs} gridCols="grid-cols-8" />
          
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SupervisorDashboard;
