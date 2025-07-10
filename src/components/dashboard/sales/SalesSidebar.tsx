
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Grid3X3, 
  Calendar, 
  CreditCard, 
  Phone, 
  Users,
  BookOpen
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    title: 'Home Page',
    url: '/sales/homepage',
    icon: Grid3X3,
  },
  {
    title: 'Trial Appointments',
    url: '/sales/trials',
    icon: Calendar,
  },
  {
    title: 'Payment Links',
    url: '/sales/payment-links',
    icon: CreditCard,
  },
  {
    title: 'Follow-up',
    url: '/sales/followup',
    icon: Phone,
  },
  {
    title: 'Students',
    url: '/sales/students',
    icon: Users,
  }
];

export function SalesSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
      "hover:bg-muted/50",
      isActive 
        ? "bg-amber-50 text-amber-800 border border-amber-200" 
        : "text-gray-700 hover:text-gray-900"
    );

  return (
    <Sidebar
      className={cn(
        "bg-white border-r border-gray-200",
        !open ? "w-16" : "w-64"
      )}
      style={{ width: open ? '256px' : '64px' }}
      variant="sidebar"
    >
      <SidebarContent className="gap-0 bg-white">
        {/* Header */}
        <div className={cn(
          "flex items-center gap-3 px-6 py-6 border-b border-gray-100",
          !open && "justify-center px-4"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <BookOpen className="h-5 w-5" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-900">Ayat & Bayan</span>
              <span className="text-sm text-gray-500">Sales Portal</span>
            </div>
          )}
        </div>

        <SidebarGroup className="px-4 py-6">
          <SidebarGroupLabel className={cn(
            "text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-0",
            !open && "sr-only"
          )}>
            Navigation
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => getNavCls({ isActive })}
                      title={!open ? item.title : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {open && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
