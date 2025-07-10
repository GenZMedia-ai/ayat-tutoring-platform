
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { SalesSidebar } from './sales/SalesSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const SalesDashboard: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SalesSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          
          <main className="flex-1 p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden p-2 hover:bg-gray-100 rounded-md" />
                <div className="flex-1">
                  <Outlet />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SalesDashboard;
