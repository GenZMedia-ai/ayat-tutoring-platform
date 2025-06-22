
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PaidStudentsSection } from '../teacher/PaidStudentsSection';
import { TodayPaidSessions } from '../teacher/TodayPaidSessions';
import { usePaidStudents } from '@/hooks/usePaidStudents';
import { useTodayPaidSessions } from '@/hooks/useTodayPaidSessions';

export const TeacherHomepage: React.FC = () => {
  const { user } = useAuth();
  const { data: paidStudents = [] } = usePaidStudents(user?.id);
  const { data: todaySessions = [] } = useTodayPaidSessions(user?.id);

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Teacher Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's your daily overview
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          Teacher Portal
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidStudents.length}</div>
            <p className="text-xs text-muted-foreground">
              Requiring registration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todaySessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Active sessions scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions Needed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {paidStudents.length + todaySessions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total pending actions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <PaidStudentsSection />
        </div>
        
        <div className="space-y-6">
          <TodayPaidSessions />
        </div>
      </div>

      {/* Additional Info */}
      {paidStudents.length === 0 && todaySessions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground">
              No paid students requiring registration or sessions scheduled for today.
              Check back later or review your upcoming schedule.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
