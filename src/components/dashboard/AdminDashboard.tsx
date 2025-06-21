
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('homepage');

  // Mock data for demonstration
  const pendingUsers = [
    { id: '1', fullName: 'Sara Ahmed', email: 'sara@example.com', role: 'teacher', teacherType: 'kids' },
    { id: '2', fullName: 'Mohamed Ali', email: 'mohamed@example.com', role: 'sales', teacherType: undefined }
  ];

  const packages = [
    { id: '1', name: '8 Session Package', description: 'Standard learning package', price: 200, sessionCount: 8, isActive: true },
    { id: '2', name: '16 Session Package', description: 'Extended learning package', price: 380, sessionCount: 16, isActive: true }
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', isEnabled: true },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', isEnabled: true },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', isEnabled: false },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', isEnabled: true }
  ];

  const handleApproveUser = (userId: string, action: 'approve' | 'reject') => {
    toast.success(`User ${action}d successfully`);
  };

  const createInvitationCode = () => {
    const code = `AYAT${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    toast.success(`Invitation code created: ${code}`);
  };

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
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{pendingUsers.length}</div>
            <p className="text-xs text-muted-foreground">Users awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{packages.filter(p => p.isActive).length}</div>
            <p className="text-xs text-muted-foreground">Available for sales</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enabled Currencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currencies.filter(c => c.isEnabled).length}</div>
            <p className="text-xs text-muted-foreground">Payment options</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
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
                  <h4 className="font-medium">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button 
                      onClick={createInvitationCode}
                      className="w-full justify-start ayat-button-primary"
                    >
                      Generate Invitation Code
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      View System Metrics
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">System Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Active Teachers:</span>
                      <span className="font-medium">24</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Students:</span>
                      <span className="font-medium">156</span>
                    </div>
                    <div className="flex justify-between">
                      <span>This Month Revenue:</span>
                      <span className="font-medium">$12,450</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-4">Pending User Approvals</h4>
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{user.fullName}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{user.role}</Badge>
                          {user.teacherType && <Badge variant="outline">{user.teacherType}</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApproveUser(user.id, 'approve')}
                          className="ayat-button-primary"
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleApproveUser(user.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingUsers.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No pending approvals</p>
                  )}
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
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="packages">Packages</TabsTrigger>
              <TabsTrigger value="currencies">Currencies</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle>Pending User Approvals</CardTitle>
                  <CardDescription>
                    Review and approve new user registrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium">{user.fullName}</h4>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{user.role}</Badge>
                            {user.teacherType && <Badge variant="outline">{user.teacherType}</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleApproveUser(user.id, 'approve')}
                            className="ayat-button-primary"
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleApproveUser(user.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                    {pendingUsers.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No pending approvals</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="packages" className="space-y-4">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle>Package Management</CardTitle>
                  <CardDescription>
                    Create and manage learning packages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Package Name</Label>
                        <Input placeholder="e.g., 8 Session Package" />
                      </div>
                      <div className="space-y-2">
                        <Label>Session Count</Label>
                        <Input type="number" placeholder="8" />
                      </div>
                      <div className="space-y-2">
                        <Label>Base Price</Label>
                        <Input type="number" placeholder="200" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input placeholder="Package description" />
                      </div>
                    </div>
                    <Button className="ayat-button-primary">Create Package</Button>

                    <div className="space-y-4">
                      <h4 className="font-medium">Existing Packages</h4>
                      {packages.map((pkg) => (
                        <div key={pkg.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div>
                            <h5 className="font-medium">{pkg.name}</h5>
                            <p className="text-sm text-muted-foreground">{pkg.description}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">{pkg.sessionCount} sessions</Badge>
                              <Badge variant="outline">Base: {pkg.price}</Badge>
                            </div>
                          </div>
                          <Badge variant={pkg.isActive ? "default" : "secondary"}>
                            {pkg.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="currencies" className="space-y-4">
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle>Currency Settings</CardTitle>
                  <CardDescription>
                    Manage available currencies for payment processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currencies.map((currency) => (
                      <div key={currency.code} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h5 className="font-medium">{currency.name} ({currency.symbol})</h5>
                          <p className="text-sm text-muted-foreground">{currency.code}</p>
                        </div>
                        <Badge variant={currency.isEnabled ? "default" : "secondary"}>
                          {currency.isEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
