
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PackageManagementTab } from '@/components/admin/PackageManagementTab';
import { CurrencyManagementTab } from '@/components/admin/CurrencyManagementTab';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const AdminSettings: React.FC = () => {
  const location = useLocation();
  
  const getActiveTab = () => {
    if (location.pathname.includes('/currencies')) return 'currencies';
    return 'packages';
  };

  return (
    <div className="space-y-4">
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground grid w-full grid-cols-2">
        <Link
          to="/admin/settings/packages"
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            getActiveTab() === 'packages'
              ? "bg-background text-foreground shadow-sm"
              : "hover:bg-background/50"
          )}
        >
          Packages
        </Link>
        <Link
          to="/admin/settings/currencies"
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            getActiveTab() === 'currencies'
              ? "bg-background text-foreground shadow-sm"
              : "hover:bg-background/50"
          )}
        >
          Currencies
        </Link>
      </div>

      {getActiveTab() === 'packages' && <PackageManagementTab />}
      {getActiveTab() === 'currencies' && <CurrencyManagementTab />}
    </div>
  );
};

export default AdminSettings;
