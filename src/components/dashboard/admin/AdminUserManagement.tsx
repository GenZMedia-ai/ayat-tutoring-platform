
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Shield, Clock } from 'lucide-react';
import RoleOverviewDashboard from './user-management/RoleOverviewDashboard';
import InvitationCodeManagement from './user-management/InvitationCodeManagement';
import PendingApprovalsSection from './user-management/PendingApprovalsSection';
import UserManagementTables from './user-management/UserManagementTables';
import RoleAnalytics from './user-management/RoleAnalytics';
import AuditTrail from './user-management/AuditTrail';

const AdminUserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6" />
        <h1 className="text-3xl font-bold">User Management & Roles</h1>
        <Badge variant="secondary">Admin Control Panel</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Invitations
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="users">
            Users
          </TabsTrigger>
          <TabsTrigger value="analytics">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="audit">
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <RoleOverviewDashboard />
        </TabsContent>

        <TabsContent value="invitations">
          <InvitationCodeManagement />
        </TabsContent>

        <TabsContent value="approvals">
          <PendingApprovalsSection />
        </TabsContent>

        <TabsContent value="users">
          <UserManagementTables />
        </TabsContent>

        <TabsContent value="analytics">
          <RoleAnalytics />
        </TabsContent>

        <TabsContent value="audit">
          <AuditTrail />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUserManagement;
