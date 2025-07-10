
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  CreditCard, 
  UserPlus, 
  Users,
  BarChart3
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
    icon: Home,
    description: 'Dashboard overview & quick actions'
  },
  {
    title: 'Trial Appointments',
    url: '/sales/trials',
    icon: Calendar,
    description: 'Manage trial sessions & follow-ups'
  },
  {
    title: 'Payment Links',
    url: '/sales/payment-links',
    icon: CreditCard,
    description: 'Create and track payment links'
  },
  {
    title: 'Follow-up',
    url: '/sales/followup',
    icon: UserPlus,
    description: 'Schedule and complete follow-ups'
  },
  {
    title: 'Students',
    url: '/sales/students',
    icon: Users,
    description: 'View and manage all students'
  }
];

export function SalesSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "sales-nav-item group",
      isActive && "sales-nav-item-active"
    );

  return (
    <Sidebar
      className={cn(
        "bg-sidebar border-r border-sidebar-border",
        !open ? "w-16" : "w-70"
      )}
      style={{ width: open ? '280px' : '64px' }}
      variant="inset"
    >
      <SidebarContent className="gap-0 bg-sidebar">
        {/* Header */}
        <div className={cn(
          "flex items-center gap-3 px-5 py-6 border-b border-sidebar-border",
          !open && "justify-center px-2"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-5 w-5" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="text-base font-semibold text-sidebar-foreground">Sales Dashboard</span>
              <span className="text-xs text-muted-foreground">Agent Portal</span>
            </div>
          )}
        </div>

        <SidebarGroup className="px-0 py-4">
          <SidebarGroupLabel className={cn(
            "sales-label px-5 mb-2",
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
                        <div className="flex flex-col min-w-0 flex-1 ml-3">
                          <span className="font-medium text-sm">{item.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        {open && (
          <div className="mt-auto p-5 border-t border-sidebar-border">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="font-medium text-sidebar-foreground">Sales Agent Portal</div>
              <div>Manage trials, payments & follow-ups</div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
