
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const RoleAnalytics: React.FC = () => {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Role Analytics</CardTitle>
        <CardDescription>User growth and performance analytics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <p className="text-muted-foreground text-lg font-medium">Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-2">Role analytics dashboard is under development</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleAnalytics;
