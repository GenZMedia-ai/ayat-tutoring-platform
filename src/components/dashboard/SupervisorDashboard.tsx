
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const SupervisorDashboard: React.FC = () => {
  // Mock data
  const supervisorStats = {
    assignedTeachers: 15,
    totalStudents: 120,
    pendingIssues: 3,
    monthlyRevenue: 15600
  };

  const teachers = [
    { id: '1', name: 'Sara Mohamed', type: 'Kids', capacity: '8/10', performance: 'Excellent' },
    { id: '2', name: 'Omar Ahmed', type: 'Mixed', capacity: '6/10', performance: 'Good' },
    { id: '3', name: 'Layla Hassan', type: 'Adult', capacity: '9/10', performance: 'Excellent' }
  ];

  const qualityAlerts = [
    { id: '1', teacher: 'Ahmed Ali', issue: 'Delayed trial confirmation', priority: 'high' },
    { id: '2', teacher: 'Sara Mohamed', issue: 'Student feedback review', priority: 'medium' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-primary">Supervisor Dashboard</h2>
        <Badge variant="outline" className="text-xs">
          Supervisor Access
        </Badge>
      </div>

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

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Team Overview</TabsTrigger>
          <TabsTrigger value="teachers">My Teachers</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Teacher Management</CardTitle>
              <CardDescription>
                Monitor and manage your assigned teachers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{teacher.name}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">{teacher.type}</Badge>
                        <Badge variant="secondary">Capacity: {teacher.capacity}</Badge>
                        <Badge variant={teacher.performance === 'Excellent' ? 'default' : 'secondary'}>
                          {teacher.performance}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button size="sm" className="ayat-button-primary">
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Quality Control</CardTitle>
              <CardDescription>
                Session observation and performance evaluation tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Session Observation</h4>
                    <div className="space-y-2">
                      <Button className="w-full justify-start ayat-button-primary">
                        Schedule Observation
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Review Past Observations
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Performance Tools</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        Teacher Feedback Forms
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Student Satisfaction Reports
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Recent Quality Actions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <span className="font-medium">Session Reassignment</span>
                        <p className="text-sm text-muted-foreground">
                          Reassigned Omar's session to Sara Mohamed
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupervisorDashboard;
