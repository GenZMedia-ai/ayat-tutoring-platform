
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  BookOpen,
  Home, 
  Calendar, 
  User, 
  Users, 
  Activity,
  TrendingUp
} from 'lucide-react';

export function TeacherSidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { user } = useAuth();

  const menuItems = [
    {
      title: t('sidebar.homepage'),
      description: 'Dashboard overview',
      url: '/teacher/homepage',
      icon: Home,
    },
    {
      title: t('sidebar.addAvailability'),
      description: 'Manage your schedule',
      url: '/teacher/availability',
      icon: Calendar,
    },
    {
      title: t('sidebar.trialAppointments'),
      description: 'Handle trial sessions',
      url: '/teacher/trials',
      icon: User,
    },
    {
      title: t('sidebar.paidRegistration'),
      description: 'Complete student registrations',
      url: '/teacher/paid-registration',
      icon: Users,
    },
    {
      title: t('sidebar.sessionManagement'),
      description: 'Track active sessions',
      url: '/teacher/session-management',
      icon: Activity,
    },
    {
      title: t('sidebar.students'),
      description: 'View student progress',
      url: '/teacher/students',
      icon: Users,
    },
    {
      title: t('sidebar.revenue'),
      description: 'Track your earnings',
      url: '/teacher/revenue',
      icon: TrendingUp,
    },
  ];

  const isActiveRoute = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(url + '/');
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'T';
  };

  return (
    <Sidebar side={isRTL ? "right" : "left"} className={`${isRTL ? 'rtl' : ''} bg-stone-50 border-stone-200`}>
      <SidebarHeader className="border-b border-stone-200 px-6 py-6">
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-lg">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className={`flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
            <span className="text-lg font-bold text-stone-800">Ayat & Bayan</span>
            <span className="text-sm text-stone-600">Teaching Platform</span>
          </div>
        </div>
        
        {user && (
          <div className={`flex items-center gap-3 mt-4 p-3 rounded-lg bg-stone-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Avatar className="h-10 w-10 border-2 border-stone-300">
              <AvatarFallback className="bg-stone-600 text-white text-sm font-semibold">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className={`flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
              <span className="text-sm font-semibold text-stone-800">Teacher Dashboard</span>
              <span className="text-xs text-stone-600">Teacher Portal</span>
            </div>
          </div>
        )}
        
        <div className={`mt-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          <LanguageToggle />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-stone-700 font-medium mb-2">
            {t('sidebar.navigation')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = isActiveRoute(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link 
                        to={item.url} 
                        className={`
                          flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                          ${isRTL ? 'flex-row-reverse' : ''}
                          ${isActive 
                            ? 'bg-stone-200 text-stone-900 border-l-4 border-stone-600 shadow-sm' 
                            : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                          }
                        `}
                      >
                        <item.icon className={`h-5 w-5 ${isActive ? 'text-stone-700' : 'text-stone-600 group-hover:text-stone-700'}`} />
                        <div className={`flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
                          <span className="text-sm font-medium">{item.title}</span>
                          <span className="text-xs text-stone-500">{item.description}</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
