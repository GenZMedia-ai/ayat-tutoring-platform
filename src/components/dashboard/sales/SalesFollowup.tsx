
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SalesFollowup: React.FC = () => {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Follow-up Queue</CardTitle>
        <CardDescription>Track and manage follow-up tasks for leads and students</CardDescription>
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

export default SalesFollowup;
