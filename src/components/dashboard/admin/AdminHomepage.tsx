
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FinancialOverview from './financial/FinancialOverview';
import TransactionHistory from './financial/TransactionHistory';
import { usePackageManagement } from '@/hooks/usePackageManagement';
import { useCurrencyManagement } from '@/hooks/useCurrencyManagement';
import { TrendingUp, Settings, Users, CreditCard } from 'lucide-react';

const AdminHomepage: React.FC = () => {
  const { packages } = usePackageManagement();
  const { currencies } = useCurrencyManagement();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Financial Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive financial overview with real-time metrics and transaction analysis
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4" />
              Active Packages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{packages.filter(p => p.is_active).length}</div>
            <p className="text-xs text-muted-foreground">Available for sales</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4" />
              Currencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currencies.filter(c => c.is_enabled).length}</div>
            <p className="text-xs text-muted-foreground">Payment options</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              Total Packages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{packages.length}</div>
            <p className="text-xs text-muted-foreground">Created packages</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Financial Overview</h2>
        <FinancialOverview />
      </div>

      {/* Transaction History Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <TransactionHistory />
      </div>

      {/* System Information */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>
            Core system settings and operational parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">Payment System</h4>
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
                  <span>Stripe Integration:</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Financial Processing</h4>
              <div className="text-sm text-muted-foreground">
                <p>All amounts converted to USD for unified reporting.</p>
                <p className="mt-2">Stripe fees: 2.9% + $0.30 per transaction</p>
                <p>Teacher compensation: 100 EGP per hour taught</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHomepage;
