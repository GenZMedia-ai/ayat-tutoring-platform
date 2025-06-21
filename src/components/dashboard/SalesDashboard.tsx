
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SimpleSalesDashboard from './SimpleSalesDashboard';

const SalesDashboard: React.FC = () => {
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
        <h2 className="text-3xl font-bold text-primary">Sales Dashboard</h2>
        <Badge variant="outline" className="text-xs">
          Sales Agent Access
        </Badge>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="homepage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="trials">Trial Appointments</TabsTrigger>
          <TabsTrigger value="followup">Follow-up</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="homepage" className="space-y-4">
          <SimpleSalesDashboard />
        </TabsContent>

        <TabsContent value="trials" className="space-y-4">
          <ComingSoonCard 
            title="Trial Appointments Management" 
            description="Schedule and manage trial sessions for prospective students"
          />
        </TabsContent>

        <TabsContent value="followup" className="space-y-4">
          <ComingSoonCard 
            title="Follow-up Queue" 
            description="Track and manage follow-up tasks for leads and students"
          />
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <ComingSoonCard 
            title="Paid Students Management" 
            description="View and manage your converted students and their enrollment status"
          />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <ComingSoonCard 
            title="Session Monitoring" 
            description="Monitor ongoing sessions and track completion rates"
          />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <ComingSoonCard 
            title="Sales Analytics" 
            description="Analyze conversion rates, revenue metrics, and performance insights"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesDashboard;
