
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export const TeacherReportsTab: React.FC = () => {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Performance Reports
        </CardTitle>
        <CardDescription>
          Track your teaching statistics and student progress
        </CardDescription>
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
