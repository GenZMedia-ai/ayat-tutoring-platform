
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TeacherSidebar } from '@/components/dashboard/teacher/TeacherSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const TeacherDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <SidebarProvider>
        <div className="flex w-full">
          <TeacherSidebar />
          <main className="flex-1 p-6">
            <div className="flex items-center gap-4 mb-6">
              <SidebarTrigger className="lg:hidden" />
              <div className="flex-1">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default TeacherDashboard;
