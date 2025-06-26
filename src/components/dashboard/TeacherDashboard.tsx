
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardNavigation from '@/components/shared/DashboardNavigation';

const TeacherDashboard: React.FC = () => {
  const tabs = [
    { value: 'homepage', label: 'Homepage', path: '/teacher/homepage' },
    { value: 'availability', label: 'Add Availability', path: '/teacher/availability' },
    { value: 'trials', label: 'Trial Appointments', path: '/teacher/trials' },
    { value: 'paid-registration', label: 'Paid Registration', path: '/teacher/paid-registration' },
    { value: 'session-management', label: 'Session Management', path: '/teacher/session-management' },
    { value: 'students', label: 'Students', path: '/teacher/students' },
    { value: 'revenue', label: 'Revenue', path: '/teacher/revenue' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-primary">Teacher Dashboard</h2>
            <Badge variant="outline" className="text-xs">
              Teacher Access
            </Badge>
          </div>

          <DashboardNavigation tabs={tabs} gridCols="grid-cols-7" />
          
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
