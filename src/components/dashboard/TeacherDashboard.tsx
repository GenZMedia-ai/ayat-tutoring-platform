
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTeacherMixedTrialSessions } from '@/hooks/useTeacherMixedTrialSessions';
import { UnifiedTeacherStudentCard } from '@/components/teacher/UnifiedTeacherStudentCard';
import { PaidStudentsSection } from '@/components/teacher/PaidStudentsSection';
import { TodayPaidSessionsSection } from '@/components/teacher/TodayPaidSessionsSection';

const TeacherDashboard: React.FC = () => {
  const { students, loading, error, refetchData } = useTeacherMixedTrialSessions();

  const getStatusCount = (status: string) => {
    return students.filter(s => s.status === status).length;
  };

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
          <TabsTrigger value="homepage">Home</TabsTrigger>
          <TabsTrigger value="paid-sessions">Paid Sessions</TabsTrigger>
          <TabsTrigger value="trials">Trial Management</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="homepage" className="space-y-4">
          {/* Paid Students Section */}
          <PaidStudentsSection />
          
          {/* Today's Paid Sessions */}
          <TodayPaidSessionsSection />
        </TabsContent>

        <TabsContent value="paid-sessions" className="space-y-4">
          <TodayPaidSessionsSection />
        </TabsContent>

        <TabsContent value="trials" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {getStatusCount('pending')}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {getStatusCount('confirmed')}
                  </div>
                  <div className="text-sm text-muted-foreground">Confirmed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {getStatusCount('trial-completed')}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {getStatusCount('awaiting-payment')}
                  </div>
                  <div className="text-sm text-muted-foreground">Awaiting Payment</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trial Students List */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Trial Students</CardTitle>
              <CardDescription>
                Manage trial sessions and student progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading students...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">Error: {error}</p>
                </div>
              )}

              {!loading && !error && students.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No trial students found.</p>
                  <p className="text-sm">Trial bookings will appear here once assigned to you.</p>
                </div>
              )}

              {!loading && !error && students.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {students.map((student) => (
                    <UnifiedTeacherStudentCard
                      key={student.id}
                      student={student}
                      onRefresh={refetchData}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Availability Management</CardTitle>
              <CardDescription>
                Manage your teaching schedule and availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Availability management feature coming soon.</p>
                <p className="text-sm">You'll be able to set your available teaching hours here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherDashboard;
