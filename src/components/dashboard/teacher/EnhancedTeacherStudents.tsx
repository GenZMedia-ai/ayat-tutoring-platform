
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTeacherActiveStudents } from '@/hooks/useTeacherActiveStudents';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  BookOpen, 
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Minus
} from 'lucide-react';
import { format, toZonedTime } from 'date-fns-tz';

const EGYPT_TIMEZONE = 'Africa/Cairo';

const EnhancedTeacherStudents: React.FC = () => {
  const { students, loading } = useTeacherActiveStudents();
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  const toggleExpanded = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  const formatDateTime = (date?: string, time?: string) => {
    if (!date || !time) return 'Not scheduled';
    
    try {
      const utcDateTimeString = `${date}T${time}Z`;
      const utcDateTime = new Date(utcDateTimeString);
      const egyptDateTime = toZonedTime(utcDateTime, EGYPT_TIMEZONE);
      return format(egyptDateTime, 'dd/MM/yyyy \'at\' h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Active Students</CardTitle>
          <CardDescription>View and manage your active students and their progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2 text-muted-foreground">Loading students...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Active Students</h1>
        <p className="text-muted-foreground">Manage your active students and track their progress</p>
      </div>

      {students.length === 0 ? (
        <Card className="dashboard-card">
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-muted-foreground text-lg font-medium">No active students found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Students will appear here once they complete registration and start their sessions
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {students.map((student) => {
            const isExpanded = expandedStudents.has(student.studentId);
            const progressPercentage = student.totalSessions > 0 
              ? (student.completedSessions / student.totalSessions) * 100 
              : 0;

            return (
              <Card key={student.studentId} className="dashboard-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{student.studentName}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-mono">{student.uniqueId}</span>
                          <span>•</span>
                          <span>Age: {student.age}</span>
                          {student.parentName && (
                            <>
                              <span>•</span>
                              <span>Parent: {student.parentName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(student.studentId)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {student.completedSessions}/{student.totalSessions}
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{student.sessionsRemaining}</p>
                      <p className="text-sm text-muted-foreground">Sessions Remaining</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{student.totalMinutes}</p>
                      <p className="text-sm text-muted-foreground">Minutes Taught</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">Next Session</p>
                      <p className="text-sm font-semibold">
                        {formatDateTime(student.nextSessionDate, student.nextSessionTime)}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{student.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{student.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">{student.platform}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {student.notes && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>Notes:</strong> {student.notes}
                      </p>
                    </div>
                  )}

                  {/* Session History (Expandable) */}
                  {isExpanded && (
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Session History
                      </h4>
                      {student.sessionHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No sessions yet</p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {student.sessionHistory.map((session) => (
                            <div
                              key={session.sessionNumber}
                              className="flex items-center justify-between p-2 bg-muted rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                {getStatusIcon(session.status)}
                                <div>
                                  <p className="text-sm font-medium">
                                    Session {session.sessionNumber}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(session.date), 'dd/MM/yyyy')}
                                    {session.actualMinutes && ` • ${session.actualMinutes} minutes`}
                                  </p>
                                </div>
                              </div>
                              <Badge className={`${getStatusColor(session.status)} border-0`}>
                                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EnhancedTeacherStudents;
