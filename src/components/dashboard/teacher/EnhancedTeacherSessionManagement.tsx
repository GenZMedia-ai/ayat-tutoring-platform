
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SessionCompletionModal } from '@/components/teacher/SessionCompletionModal';
import { SessionProgressTracker } from '@/components/teacher/SessionProgressTracker';
import { useTodayPaidSessions } from '@/hooks/useTodayPaidSessions';
import { useTeacherActiveStudents } from '@/hooks/useTeacherActiveStudents';
import { 
  Clock, 
  Play, 
  CheckCircle, 
  Calendar, 
  User, 
  TrendingUp,
  BookOpen,
  Target,
  Users
} from 'lucide-react';

const EnhancedTeacherSessionManagement: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const { sessions: todayPaidSessions, loading: sessionsLoading, refreshSessions } = useTodayPaidSessions();
  const { students: activeStudents, loading: studentsLoading, refreshStudents } = useTeacherActiveStudents();

  const handleCompleteSession = (session: any) => {
    console.log('📝 Opening session completion modal for:', session.studentName);
    setSelectedSession(session);
  };

  const handleSessionCompletionSuccess = () => {
    console.log('✅ Session completed successfully');
    setSelectedSession(null);
    refreshSessions();
    refreshStudents();
  };

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      return timeStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary">Session Management Hub</h1>
          <p className="text-muted-foreground">
            Manage today's sessions and track student progress in real-time
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Today's Sessions</p>
                <p className="text-2xl font-bold text-blue-900">
                  {sessionsLoading ? '...' : todayPaidSessions.length}
                </p>
              </div>
              <div className="p-2 bg-blue-200 rounded-lg">
                <Clock className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Active Students</p>
                <p className="text-2xl font-bold text-green-900">
                  {studentsLoading ? '...' : activeStudents.length}
                </p>
              </div>
              <div className="p-2 bg-green-200 rounded-lg">
                <Users className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-900">
                  {activeStudents.length > 0 ? '92%' : '0%'}
                </p>
              </div>
              <div className="p-2 bg-purple-200 rounded-lg">
                <Target className="h-5 w-5 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today's Sessions
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Student Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Play className="h-5 w-5 text-blue-600" />
                </div>
                Today's Scheduled Sessions
                <Badge variant="outline" className="ml-2">
                  {todayPaidSessions.length} sessions
                </Badge>
              </CardTitle>
              <CardDescription>
                Complete sessions after teaching to track progress and update records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-muted-foreground">Loading today's sessions...</span>
                </div>
              ) : todayPaidSessions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-xl w-fit mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-gray-400 mx-auto" />
                  </div>
                  <p className="text-gray-600 text-lg font-medium mb-2">No sessions scheduled for today</p>
                  <p className="text-sm text-gray-500">
                    Enjoy your free time! Check back tomorrow for new sessions.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {todayPaidSessions.map((session) => (
                    <Card key={session.id} className="border border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-500 rounded-full">
                                <User className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{session.studentName}</h4>
                                <p className="text-sm text-gray-600">Session {session.sessionNumber}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-blue-600" />
                                <span className="font-medium">{formatTime(session.scheduledTime)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Target className="h-3 w-3 text-green-600" />
                                <span>Progress: {session.completedSessions}/{session.totalSessions}</span>
                              </div>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                                style={{ 
                                  width: `${session.totalSessions > 0 ? (session.completedSessions / session.totalSessions) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          <Button 
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white ml-4"
                            onClick={() => handleCompleteSession(session)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                Student Progress Overview
                <Badge variant="outline" className="ml-2">
                  {activeStudents.length} active students
                </Badge>
              </CardTitle>
              <CardDescription>
                Track progress and completion rates for all your active students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-muted-foreground">Loading student progress...</span>
                </div>
              ) : activeStudents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-xl w-fit mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-400 mx-auto" />
                  </div>
                  <p className="text-gray-600 text-lg font-medium mb-2">No active students</p>
                  <p className="text-sm text-gray-500">
                    Students will appear here after completing their registration and payment
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeStudents.map((student) => (
                    <SessionProgressTracker
                      key={student.studentId}
                      studentId={student.studentId}
                      studentName={student.studentName}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SessionCompletionModal
        session={selectedSession}
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        onSuccess={handleSessionCompletionSuccess}
      />
    </div>
  );
};

export default EnhancedTeacherSessionManagement;
