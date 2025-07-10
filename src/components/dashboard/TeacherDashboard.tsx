
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { TeacherSidebar } from '@/components/dashboard/teacher/TeacherSidebar';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import '@/styles/rtl.css';

const TeacherDashboardContent: React.FC = () => {
  const { isRTL } = useLanguage();

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full ${isRTL ? 'rtl' : ''}`}>
        <TeacherSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-stone-50">
            <DashboardHeader />
            <main className="p-6">
              <div className="space-y-6">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <SidebarTrigger />
                    <h2 className="text-3xl font-bold text-stone-800">Teacher Dashboard</h2>
                  </div>
                  <Badge variant="outline" className="text-xs border-stone-300 text-stone-700 bg-stone-100">
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

const TeacherDashboard: React.FC = () => {
  return (
    <LanguageProvider>
      <TeacherDashboardContent />
    </LanguageProvider>
  );
};

export default TeacherDashboard;
