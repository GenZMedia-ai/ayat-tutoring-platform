
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminSessions: React.FC = () => {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Paid Sessions Monitoring</CardTitle>
        <CardDescription>Monitor and manage all paid sessions across the platform</CardDescription>
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
};

export default AdminSessions;
