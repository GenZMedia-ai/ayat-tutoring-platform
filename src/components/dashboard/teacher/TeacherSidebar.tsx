
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { 
  Home, 
  Calendar, 
  User, 
  Users, 
  Settings, 
  Activity,
  TrendingUp
} from 'lucide-react';

export function TeacherSidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const menuItems = [
    {
      title: t('sidebar.homepage'),
      url: '/teacher/homepage',
      icon: Home,
    },
    {
      title: t('sidebar.addAvailability'),
      url: '/teacher/availability',
      icon: Calendar,
    },
    {
      title: t('sidebar.trialAppointments'),
      url: '/teacher/trials',
      icon: User,
    },
    {
      title: t('sidebar.paidRegistration'),
      url: '/teacher/paid-registration',
      icon: Users,
    },
    {
      title: t('sidebar.sessionManagement'),
      url: '/teacher/session-management',
      icon: Activity,
    },
    {
      title: t('sidebar.students'),
      url: '/teacher/students',
      icon: Users,
    },
    {
      title: t('sidebar.revenue'),
      url: '/teacher/revenue',
      icon: TrendingUp,
    },
  ];

  const isActiveRoute = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(url + '/');
  };

  return (
    <Sidebar className={isRTL ? 'rtl' : ''}>
      <SidebarHeader className="border-b border-border px-6 py-4">
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Settings className="h-4 w-4" />
          </div>
          <div className={`flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
            <span className="text-sm font-semibold">{t('sidebar.title')}</span>
            <span className="text-xs text-muted-foreground">{t('sidebar.subtitle')}</span>
          </div>
        </div>
        <div className={`mt-3 ${isRTL ? 'text-right' : 'text-left'}`}>
          <LanguageToggle />
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
                    <Link to={item.url} className={isRTL ? 'flex-row-reverse' : ''}>
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
