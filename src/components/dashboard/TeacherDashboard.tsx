
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { TeacherSidebar } from '@/components/dashboard/teacher/TeacherSidebar';

const TeacherDashboard: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TeacherSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50">
            <DashboardHeader />
            <main className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <h2 className="text-3xl font-bold text-primary">Teacher Dashboard</h2>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Teacher Access
                  </Badge>
                </div>
                
                <Outlet />
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default TeacherDashboard;
