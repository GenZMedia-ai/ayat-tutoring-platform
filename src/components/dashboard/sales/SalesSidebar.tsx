import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  CreditCard, 
  UserPlus, 
  Users,
  ChevronRight,
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
  const isExpanded = navigationItems.some((item) => isActive(item.url));

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
      isActive 
        ? "bg-primary text-primary-foreground shadow-sm" 
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    );

  return (
    <Sidebar
      className={cn(
        "border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        !open ? "w-16" : "w-64"
      )}
      variant="inset"
    >
      <SidebarContent className="gap-0">
        {/* Header */}
        <div className={cn(
          "flex items-center gap-2 px-4 py-4 border-b border-border/40",
          !open && "justify-center px-2"
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Sales Dashboard</span>
              <span className="text-xs text-muted-foreground">Agent Portal</span>
            </div>
          )}
        </div>

        <SidebarGroup className="px-4 py-4">
          <SidebarGroupLabel className={cn(
            "text-xs font-medium text-muted-foreground mb-2",
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
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {open && (
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium truncate">{item.title}</span>
                          <span className="text-xs text-muted-foreground/80 truncate">
                            {item.description}
                          </span>
                        </div>
                      )}
                      {open && (
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
          <div className="mt-auto p-4 border-t border-border/40">
            <div className="text-xs text-muted-foreground">
              <div className="font-medium">Sales Agent Portal</div>
              <div>Manage trials, payments & follow-ups</div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}