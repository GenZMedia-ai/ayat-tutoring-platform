
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
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      `grid w-full ${gridCols}`,
      className
    )}>
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          to={tab.path}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            isActiveTab(tab.path)
              ? "bg-background text-foreground shadow-sm"
              : "hover:bg-background/50"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
};

export default DashboardNavigation;
