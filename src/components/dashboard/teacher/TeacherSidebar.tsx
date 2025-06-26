
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
  SidebarFooter
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  User, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  DollarSign,
  BookOpen
} from 'lucide-react';

const menuItems = [
  {
    title: 'Homepage',
    path: '/teacher/homepage',
    icon: BookOpen,
    description: 'Dashboard overview'
  },
  {
    title: 'Availability',
    path: '/teacher/availability',
    icon: Calendar,
    description: 'Manage your schedule'
  },
  {
    title: 'Trial Sessions',
    path: '/teacher/trials',
    icon: Clock,
    description: 'Handle trial appointments'
  },
  {
    title: 'Registration',
    path: '/teacher/paid-registration',
    icon: Users,
    description: 'Complete student setup'
  },
  {
    title: 'Sessions',
    path: '/teacher/session-management',
    icon: CheckCircle,
    description: 'Manage active sessions'
  },
  {
    title: 'Students',
    path: '/teacher/students',
    icon: User,
    description: 'View your students'
  },
  {
    title: 'Revenue',
    path: '/teacher/revenue',
    icon: DollarSign,
    description: 'Track your earnings'
  }
];

interface TeacherSidebarProps {
  className?: string;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({ className }) => {
  const location = useLocation();
  
  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Sidebar className={cn("border-r border-border bg-card", className)}>
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-primary">Teacher Panel</h2>
            <p className="text-xs text-muted-foreground">Manage your teaching</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={cn(
                      "w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      "hover:bg-primary/10 hover:text-primary",
                      isActiveRoute(item.path) && 
                      "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                    )}
                  >
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="text-xs opacity-75 truncate">{item.description}</div>
                      </div>
                      {isActiveRoute(item.path) && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Active
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

      <SidebarFooter className="border-t border-border p-4">
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            Teacher Access
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
