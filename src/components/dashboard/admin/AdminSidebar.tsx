
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
  Users,
  TrendingUp,
  Settings,
  Calendar,
  GraduationCap,
  BookOpen,
  Bell,
  Shield,
  Database,
  BarChart3,
  UserCog,
  MessageSquare
} from 'lucide-react';
import { useAdvancedFinancialData } from '@/hooks/useAdvancedFinancialData';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  badgeVariant?: 'default' | 'destructive' | 'secondary';
}

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { systemMetrics, loading } = useAdvancedFinancialData();

  const menuItems: MenuItem[] = [
    {
      title: 'Command Center',
      path: '/admin/homepage',
      icon: Home,
    },
    {
      title: 'User Management',
      path: '/admin/user-management',
      icon: UserCog,
      badge: !loading ? systemMetrics.pendingApprovals : undefined,
      badgeVariant: systemMetrics.pendingApprovals > 0 ? 'destructive' : 'secondary'
    },
    {
      title: 'Business Intelligence',
      path: '/admin/analytics',
      icon: BarChart3,
    },
    {
      title: 'System Configuration',
      path: '/admin/configuration',
      icon: Settings,
    },
    {
      title: 'Trial Management',
      path: '/admin/trials',
      icon: Calendar,
    },
    {
      title: 'Student Records',
      path: '/admin/students',
      icon: GraduationCap,
      badge: !loading ? systemMetrics.totalUsers : undefined,
    },
    {
      title: 'Session Oversight',
      path: '/admin/sessions',
      icon: BookOpen,
      badge: !loading ? systemMetrics.completedSessions : undefined,
    },
    {
      title: 'Notifications',
      path: '/admin/notifications',
      icon: Bell,
    },
    {
      title: 'Advanced Settings',
      path: '/admin/settings',
      icon: Shield,
    },
  ];

  const isActiveItem = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="brand-gradient w-10 h-10 rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Admin Panel</h3>
            <p className="text-xs text-gray-500">Full System Control</p>
          </div>
        </div>
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActiveItem('/admin/homepage')}>
                  <Link to="/admin/homepage">
                    <Home className="h-4 w-4" />
                    <span>Command Center</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.slice(1, 4).map((item) => (
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
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.slice(4, 7).map((item) => (
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
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.slice(7).map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={isActiveItem(item.path)}>
                    <Link to={item.path}>
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

      <SidebarFooter className="p-4">
        <div className="text-xs text-gray-500 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Database className="h-3 w-3" />
            <span>System Status: Online</span>
          </div>
          <p>Ultimate Admin Access</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
