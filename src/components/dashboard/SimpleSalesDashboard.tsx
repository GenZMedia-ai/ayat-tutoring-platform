
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MessageCircle, TrendingUp, Clock, User } from 'lucide-react';
import { useMixedStudentData } from '@/hooks/useMixedStudentData';
import { useAuth } from '@/contexts/AuthContext';

const SimpleSalesDashboard: React.FC = () => {
  const { user } = useAuth();
  const { items, loading } = useMixedStudentData();

  // Filter data for dashboard metrics
  const pendingTrials = items.filter(item => {
    const data = item.data;
    const status = item.type === 'individual' ? data.status : data.status;
    return status === 'confirmed' || status === 'pending';
  });

  const completedTrials = items.filter(item => {
    const data = item.data;
    const status = item.type === 'individual' ? data.status : data.status;
    return status === 'trial-completed';
  });

  const awaitingPayment = items.filter(item => {
    const data = item.data;
    const status = item.type === 'individual' ? data.status : data.status;
    return status === 'awaiting-payment';
  });

  const activeStudents = items.filter(item => {
    const data = item.data;
    const status = item.type === 'individual' ? data.status : data.status;
    return status === 'paid' || status === 'active';
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Sales Command Center</h2>
          <p className="text-muted-foreground">
            Your daily overview and quick actions
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {user?.role} Dashboard
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Trials</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingTrials.length}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled trial sessions
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-up Required</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTrials.length}</div>
            <p className="text-xs text-muted-foreground">
              Completed trials need follow-up
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Payment</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{awaitingPayment.length}</div>
            <p className="text-xs text-muted-foreground">
              Payment links pending
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{activeStudents.length}</div>
            <p className="text-xs text-muted-foreground">
              Paid & enrolled students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/?tab=trials">
                <Calendar className="h-4 w-4 mr-2" />
                Manage Trial Sessions
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/?tab=followup">
                <MessageCircle className="h-4 w-4 mr-2" />
                Follow-up Management
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/booking">
                <User className="h-4 w-4 mr-2" />
                Book New Trial
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Daily Summary</CardTitle>
            <CardDescription>
              Today's performance overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Trials Today:</span>
                <Badge variant="outline">{pendingTrials.length} scheduled</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Follow-ups:</span>
                <Badge variant="outline">{completedTrials.length} needed</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Conversion Rate:</span>
                <Badge variant="outline">
                  {items.length > 0 ? Math.round((activeStudents.length / items.length) * 100) : 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates from your student pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No recent activity. Start by booking a new trial session.
            </p>
          ) : (
            <div className="space-y-3">
              {items.slice(0, 5).map((item) => {
                const data = item.data;
                // Handle both individual students and family groups with proper type checking
                const displayName = item.type === 'individual' 
                  ? ('name' in data ? data.name : 'Individual Student')
                  : ('parent_name' in data ? data.parent_name : 'Family Group');
                const status = item.type === 'individual' ? data.status : data.status;
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.type === 'individual' ? 'Individual' : 'Family'} • {data.country}
                      </p>
                    </div>
                    <Badge variant="outline">{status}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleSalesDashboard;
