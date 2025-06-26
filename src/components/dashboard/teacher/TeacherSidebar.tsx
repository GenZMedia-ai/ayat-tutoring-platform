
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Calendar,
  Users,
  BookOpen,
  DollarSign,
  Clock,
  GraduationCap,
  User
} from 'lucide-react';
import { useTodayPaidSessions } from '@/hooks/useTodayPaidSessions';
import { useTeacherPaidStudents } from '@/hooks/useTeacherPaidStudents';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  badgeVariant?: 'default' | 'destructive' | 'secondary';
}

const TeacherSidebar: React.FC = () => {
  const location = useLocation();
  const { sessions } = useTodayPaidSessions();
  const { paidStudents } = useTeacherPaidStudents();

  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      path: '/teacher/homepage',
      icon: Home,
    },
    {
      title: 'Availability',
      path: '/teacher/availability',
      icon: Calendar,
    },
    {
      title: 'Trial Sessions',
      path: '/teacher/trials',
      icon: Clock,
    },
    {
      title: 'Paid Registration',
      path: '/teacher/paid-registration',
      icon: Users,
      badge: paidStudents.length > 0 ? paidStudents.length : undefined,
      badgeVariant: paidStudents.length > 0 ? 'default' : 'secondary'
    },
    {
      title: 'Session Management',
      path: '/teacher/session-management',
      icon: BookOpen,
      badge: sessions.length > 0 ? sessions.length : undefined,
      badgeVariant: sessions.length > 0 ? 'default' : 'secondary'
    },
    {
      title: 'Students',
      path: '/teacher/students',
      icon: GraduationCap,
    },
    {
      title: 'Revenue',
      path: '/teacher/revenue',
      icon: DollarSign,
    },
  ];

  const isActiveItem = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Teacher Portal</h3>
            <p className="text-xs text-gray-500">Manage Your Classes</p>
          </div>
        </div>
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Teaching</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.slice(0, 3).map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActiveItem(item.path)}>
                    <Link to={item.path} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <Badge variant={item.badgeVariant || 'secondary'} className="text-xs ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.slice(3).map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActiveItem(item.path)}>
                    <Link to={item.path} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <Badge variant={item.badgeVariant || 'secondary'} className="text-xs ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-xs text-gray-500 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Online</span>
          </div>
          <p>Ready to Teach</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default TeacherSidebar;
