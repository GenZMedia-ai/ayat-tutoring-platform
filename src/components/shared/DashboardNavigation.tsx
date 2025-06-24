
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavigationTab {
  value: string;
  label: string;
  path: string;
}

interface DashboardNavigationProps {
  tabs: NavigationTab[];
  className?: string;
  gridCols?: string;
}

const DashboardNavigation: React.FC<DashboardNavigationProps> = ({
  tabs,
  className,
  gridCols = "grid-cols-5"
}) => {
  const location = useLocation();
  
  const isActiveTab = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className={cn(
      "modern-pill-tabs",
      `grid w-full ${gridCols}`,
      className
    )}>
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          to={tab.path}
          className={cn(
            "modern-pill-tab",
            isActiveTab(tab.path) ? "data-[state=active]" : ""
          )}
          data-state={isActiveTab(tab.path) ? "active" : "inactive"}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
};

export default DashboardNavigation;
