
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SupervisorHomepage: React.FC = () => {
  // Mock data
  const supervisorStats = {
    assignedTeachers: 15,
    totalStudents: 120,
    pendingIssues: 3,
    monthlyRevenue: 15600
  };

  const qualityAlerts = [
    { id: '1', teacher: 'Ahmed Ali', issue: 'Delayed trial confirmation', priority: 'high' },
    { id: '2', teacher: 'Sara Mohamed', issue: 'Student feedback review', priority: 'medium' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">My Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{supervisorStats.assignedTeachers}</div>
            <p className="text-xs text-muted-foreground">Under supervision</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{supervisorStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Active learners</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{supervisorStats.pendingIssues}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${supervisorStats.monthlyRevenue}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Team Performance Summary</CardTitle>
            <CardDescription>
              Overview of your teaching team's performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Active Teachers:</span>
                  <span className="font-medium">15/15</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Capacity:</span>
                  <span className="font-medium">7.8/10</span>
                </div>
                <div className="flex justify-between">
                  <span>Trial Completion:</span>
                  <span className="font-medium">94%</span>
                </div>
                <div className="flex justify-between">
                  <span>Student Satisfaction:</span>
                  <span className="font-medium">4.8/5</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Quality Alerts</CardTitle>
            <CardDescription>
              Issues requiring your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qualityAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium">{alert.teacher}</h4>
                    <p className="text-sm text-muted-foreground">{alert.issue}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.priority === 'high' ? 'destructive' : 'secondary'}>
                      {alert.priority}
                    </Badge>
                    <Button size="sm" className="ayat-button-primary">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupervisorHomepage;
