
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Users, BookOpen } from 'lucide-react';
import { TeacherHomepage } from './TeacherHomepage';

const TeacherDashboard: React.FC = () => {
  const ComingSoonCard = ({ title, description, icon: Icon }: { 
    title: string; 
    description: string; 
    icon: React.ElementType;
  }) => (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
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
        <h2 className="text-3xl font-bold text-primary">Teacher Dashboard</h2>
        <Badge variant="outline" className="text-xs">
          Teacher Portal
        </Badge>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="homepage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="sessions">All Sessions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="homepage" className="space-y-4">
          <TeacherHomepage />
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <ComingSoonCard 
            title="Availability Management" 
            description="Set your weekly availability and manage time slots"
            icon={Clock}
          />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <ComingSoonCard 
            title="Session History" 
            description="View all past and upcoming sessions with detailed information"
            icon={Calendar}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ComingSoonCard 
            title="Performance Reports" 
            description="Track your teaching statistics and student progress"
            icon={BookOpen}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherDashboard;
