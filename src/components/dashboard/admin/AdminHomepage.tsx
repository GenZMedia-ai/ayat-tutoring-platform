
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePackageManagement } from '@/hooks/usePackageManagement';
import { useCurrencyManagement } from '@/hooks/useCurrencyManagement';

const AdminHomepage: React.FC = () => {
  const { packages } = usePackageManagement();
  const { currencies } = useCurrencyManagement();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{packages.filter(p => p.is_active).length}</div>
            <p className="text-xs text-muted-foreground">Available for sales</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enabled Currencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currencies.filter(c => c.is_enabled).length}</div>
            <p className="text-xs text-muted-foreground">Payment options</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{packages.length}</div>
            <p className="text-xs text-muted-foreground">Created packages</p>
          </CardContent>
        </Card>
      </div>

      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>
            Welcome to the Ayat w Bian administrative panel. Manage users, packages, and system settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Quick Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Active Packages:</span>
                  <span className="font-medium">{packages.filter(p => p.is_active).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Enabled Currencies:</span>
                  <span className="font-medium">{currencies.filter(c => c.is_enabled).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Packages:</span>
                  <span className="font-medium">{packages.length}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Payment System</h4>
              <div className="text-sm text-muted-foreground">
                <p>Configure packages and currencies for the payment processing workflow.</p>
                <p className="mt-2">Sales agents can create payment links for completed trials.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHomepage;
