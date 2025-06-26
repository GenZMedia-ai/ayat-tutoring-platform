
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { 
  Home, 
  Calendar, 
  User, 
  Users, 
  Settings, 
  Activity,
  TrendingUp
} from 'lucide-react';

const menuItems = [
  {
    title: 'Homepage',
    url: '/teacher/homepage',
    icon: Home,
  },
  {
    title: 'Add Availability',
    url: '/teacher/availability',
    icon: Calendar,
  },
  {
    title: 'Trial Appointments',
    url: '/teacher/trials',
    icon: User,
  },
  {
    title: 'Paid Registration',
    url: '/teacher/paid-registration',
    icon: Users,
  },
  {
    title: 'Session Management',
    url: '/teacher/session-management',
    icon: Activity,
  },
  {
    title: 'Students',
    url: '/teacher/students',
    icon: Users,
  },
  {
    title: 'Revenue',
    url: '/teacher/revenue',
    icon: TrendingUp,
  },
];

export function TeacherSidebar() {
  const location = useLocation();

  const isActiveRoute = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(url + '/');
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Settings className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Teacher Dashboard</span>
            <span className="text-xs text-muted-foreground">Manage your classes</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActiveRoute(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
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
