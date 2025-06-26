
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import TeacherSidebar from './teacher/TeacherSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const TeacherDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <SidebarProvider>
        <div className="flex w-full min-h-screen">
          <TeacherSidebar />
          <div className="flex-1 flex flex-col">
            <DashboardHeader />
            <main className="flex-1 p-6 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default TeacherDashboard;
