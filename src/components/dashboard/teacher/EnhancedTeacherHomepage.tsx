import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTeacherActiveStudents } from '@/hooks/useTeacherActiveStudents';
import { useTodayPaidSessions } from '@/hooks/useTodayPaidSessions';
import { useTeacherRevenue } from '@/hooks/useTeacherRevenue';
import { DateFilter, DateRange } from '@/components/teacher/DateFilter';
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  User, 
  Calendar,
  Award,
  BookOpen,
  Target
} from 'lucide-react';

const EnhancedTeacherHomepage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('this-week');
  const { students: activeStudents, loading: studentsLoading } = useTeacherActiveStudents();
  const { sessions: todayPaidSessions, loading: sessionsLoading } = useTodayPaidSessions();
  const { revenue, loading: revenueLoading } = useTeacherRevenue('this-month');

  const totalUpcomingSessions = activeStudents.reduce((sum, student) => 
    sum + (student.totalPaidSessions - student.completedPaidSessions), 0
  );

  const completionRate = activeStudents.length > 0 
    ? Math.round((activeStudents.reduce((sum, s) => sum + s.completedPaidSessions, 0) / 
        activeStudents.reduce((sum, s) => sum + s.totalPaidSessions, 0)) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Teaching Dashboard
            </h1>
            <p className="text-muted-foreground">
              Overview of your teaching activities and performance
            </p>
          </div>
        </div>
        <DateFilter 
          value={dateRange} 
          onChange={setDateRange}
          resultCount={todayPaidSessions.length}
        />
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="dashboard-card border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Today's Sessions</p>
                <p className="text-2xl font-bold text-blue-700">
                  {sessionsLoading ? '-' : todayPaidSessions.length}
                </p>
                <p className="text-xs text-blue-500 mt-1">Paid sessions only</p>
              </div>
              <div className="p-2 bg-blue-500 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active Students</p>
                <p className="text-2xl font-bold text-green-700">
                  {studentsLoading ? '-' : activeStudents.length}
                </p>
                <p className="text-xs text-green-500 mt-1">Ongoing programs</p>
              </div>
              <div className="p-2 bg-green-500 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Remaining Sessions</p>
                <p className="text-2xl font-bold text-purple-700">
                  {studentsLoading ? '-' : totalUpcomingSessions}
                </p>
                <p className="text-xs text-purple-500 mt-1">Across all students</p>
              </div>
              <div className="p-2 bg-purple-500 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Monthly Revenue</p>
                <p className="text-2xl font-bold text-orange-700">
                  {revenueLoading ? '-' : `${revenue.totalEarnings.toLocaleString()} EGP`}
                </p>
                <p className="text-xs text-orange-500 mt-1">This month</p>
              </div>
              <div className="p-2 bg-orange-500 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Today's Paid Sessions */}
        <Card className="dashboard-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                Today's Paid Sessions
              </CardTitle>
              <Badge variant="outline" className="bg-blue-50 border-blue-200">
                {todayPaidSessions.length} scheduled
              </Badge>
            </div>
            <CardDescription>
              Your paid sessions scheduled for today (trials excluded)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                  <span className="text-muted-foreground">Loading sessions...</span>
                </div>
              </div>
            ) : todayPaidSessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No paid sessions today</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your next sessions will appear here
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {todayPaidSessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="p-3 border border-border rounded-lg bg-gradient-to-r from-blue-50 to-white hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-primary/10 rounded-full">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{session.studentName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Session {session.sessionNumber} • {session.scheduledTime}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {todayPaidSessions.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground">
                    +{todayPaidSessions.length - 5} more sessions
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Progress Overview */}
        <Card className="dashboard-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <Award className="h-4 w-4 text-green-600" />
                </div>
                Student Progress
              </CardTitle>
              <Badge variant="outline" className="bg-green-50 border-green-200">
                {completionRate}% complete
              </Badge>
            </div>
            <CardDescription>
              Overall progress across all your active students
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {studentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                  <span className="text-muted-foreground">Loading students...</span>
                </div>
              </div>
            ) : activeStudents.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No active students</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Students will appear here after registration completion
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-green-800">Overall Completion</span>
                    <span className="font-bold text-green-900">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                  <div className="flex justify-between text-xs text-green-600 mt-2">
                    <span>
                      {activeStudents.reduce((sum, s) => sum + s.completedPaidSessions, 0)} completed
                    </span>
                    <span>
                      {activeStudents.reduce((sum, s) => sum + s.totalPaidSessions, 0)} total
                    </span>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activeStudents.slice(0, 4).map((student) => (
                    <div key={student.studentId} className="p-3 border border-border rounded-lg bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{student.studentName}</h4>
                        <Badge variant="outline" className="text-xs">
                          {student.completedPaidSessions}/{student.totalPaidSessions}
                        </Badge>
                      </div>
                      <Progress 
                        value={(student.completedPaidSessions / student.totalPaidSessions) * 100} 
                        className="h-1.5"
                      />
                    </div>
                  ))}
                  {activeStudents.length > 4 && (
                    <p className="text-center text-sm text-muted-foreground">
                      +{activeStudents.length - 4} more students
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedTeacherHomepage;
