
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PackageManagementTab } from '@/components/admin/PackageManagementTab';
import { CurrencyManagementTab } from '@/components/admin/CurrencyManagementTab';
import { usePackageManagement } from '@/hooks/usePackageManagement';
import { useCurrencyManagement } from '@/hooks/useCurrencyManagement';

const AdminDashboard: React.FC = () => {
  const { packages } = usePackageManagement();
  const { currencies } = useCurrencyManagement();

  const ComingSoonCard = ({ title, description }: { title: string; description: string }) => (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <p className="text-muted-foreground text-lg font-medium">Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-2">This feature is under development</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-primary">Admin Dashboard</h2>
        <Badge variant="outline" className="text-xs">
          Administrator Access
        </Badge>
      </div>

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

      <Tabs defaultValue="homepage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="trials">Trial Appointments</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="homepage" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="trials" className="space-y-4">
          <ComingSoonCard 
            title="All Trial Appointments" 
            description="Monitor and manage all trial sessions across the platform"
          />
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <ComingSoonCard 
            title="Paid Students Management" 
            description="View and manage all paid students across the platform"
          />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <ComingSoonCard 
            title="Paid Sessions Monitoring" 
            description="Monitor and manage all paid sessions across the platform"
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Tabs defaultValue="packages" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="packages">Packages</TabsTrigger>
              <TabsTrigger value="currencies">Currencies</TabsTrigger>
            </TabsList>

            <TabsContent value="packages" className="space-y-4">
              <PackageManagementTab />
            </TabsContent>

            <TabsContent value="currencies" className="space-y-4">
              <CurrencyManagementTab />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
