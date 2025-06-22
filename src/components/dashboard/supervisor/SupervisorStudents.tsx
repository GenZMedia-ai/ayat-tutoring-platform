
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SupervisorStudents: React.FC = () => {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Student Overview</CardTitle>
        <CardDescription>Monitor all students under your supervision</CardDescription>
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

export default SupervisorStudents;
