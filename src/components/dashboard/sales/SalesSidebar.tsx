
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Link, 
  Phone, 
  Users,
  BookOpen
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    title: 'Home Page',
    description: 'Dashboard overview',
    url: '/sales/homepage',
    icon: Home,
  },
  {
    title: 'Trial Appointments',
    description: 'Manage trial sessions',
    url: '/sales/trials',
    icon: Calendar,
  },
  {
    title: 'Payment Links',
    description: 'Create & manage payments',
    url: '/sales/payment-links',
    icon: Link,
  },
  {
    title: 'Follow-up',
    description: 'Track pending follow-ups',
    url: '/sales/followup',
    icon: Phone,
  },
  {
    title: 'Students',
    description: 'View all student profiles',
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
      "flex flex-col items-start gap-1 px-4 py-3 rounded-lg text-left transition-colors w-full",
      "hover:bg-stone-50/50",
      isActive 
        ? "bg-stone-100 text-stone-800 border-l-4 border-stone-600" 
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
        {/* Header with Logo */}
        <div className={cn(
          "flex items-center gap-3 px-6 py-6 border-b border-gray-100",
          !open && "justify-center px-4"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-800">
            <BookOpen className="h-5 w-5" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-900">Ayat & Bayan</span>
            </div>
          )}
        </div>

        {/* Profile Section */}
        {open && (
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-stone-100 text-stone-800 font-medium">
                  SA
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">Sales Dashboard</span>
                <span className="text-xs text-gray-500">Agent Portal</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <SidebarGroup className="px-4 py-6">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => getNavCls({ isActive })}
                      title={!open ? item.title : undefined}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {open && (
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">{item.title}</span>
                            <span className="text-xs text-gray-500">{item.description}</span>
                          </div>
                        )}
                      </div>
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
