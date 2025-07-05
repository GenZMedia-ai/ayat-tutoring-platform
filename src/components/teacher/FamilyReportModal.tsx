import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  FileText,
  Download
} from 'lucide-react';
import { ActiveFamilyGroup } from '@/hooks/useTeacherActiveStudents';

interface FamilyReportModalProps {
  family: ActiveFamilyGroup;
  open: boolean;
  onClose: () => void;
}

export const FamilyReportModal: React.FC<FamilyReportModalProps> = ({
  family,
  open,
  onClose
}) => {
  const exportReport = () => {
    const reportData = `
Family Report - ${family.familyName}
Generated: ${new Date().toLocaleDateString()}

FAMILY OVERVIEW:
- Parent: ${family.parentName}
- Students: ${family.totalStudents}
- Total Sessions: ${family.totalSessions}
- Completed Sessions: ${family.completedSessions}
- Total Minutes: ${family.totalMinutes}
- Progress: ${Math.round((family.completedSessions / family.totalSessions) * 100)}%

INDIVIDUAL STUDENT PROGRESS:
${family.students.map(student => `
Student: ${student.studentName} (Age ${student.age})
- Sessions: ${student.completedPaidSessions}/${student.totalPaidSessions}
- Minutes: ${student.totalMinutes}
- Progress: ${Math.round((student.completedPaidSessions / student.totalPaidSessions) * 100)}%
- Next Session: ${student.nextSessionDate ? new Date(student.nextSessionDate).toLocaleDateString() : 'Not scheduled'}
`).join('')}
    `.trim();

    const blob = new Blob([reportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${family.familyName.replace(/\s+/g, '_')}_Family_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const overallProgress = Math.round((family.completedSessions / family.totalSessions) * 100);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {family.familyName} - Family Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Family Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Family Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{family.totalStudents}</div>
                  <div className="text-sm text-muted-foreground">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{family.completedSessions}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{family.totalMinutes}</div>
                  <div className="text-sm text-muted-foreground">Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{overallProgress}%</div>
                  <div className="text-sm text-muted-foreground">Progress</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Family Progress</span>
                  <span>{family.completedSessions}/{family.totalSessions} sessions</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>

              {family.nextFamilySession && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    Next Session: <strong>{family.nextFamilySession.studentName}</strong> on{' '}
                    {new Date(family.nextFamilySession.date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Individual Student Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Individual Student Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {family.students.map((student, index) => {
                const studentProgress = Math.round((student.completedPaidSessions / student.totalPaidSessions) * 100);
                
                return (
                  <div key={student.studentId} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {student.studentName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{student.studentName}</h4>
                          <p className="text-sm text-muted-foreground">Age {student.age}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {studentProgress}% Complete
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Sessions</div>
                        <div className="font-medium">
                          {student.completedPaidSessions}/{student.totalPaidSessions}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Minutes</div>
                        <div className="font-medium">{student.totalMinutes}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Next Session</div>
                        <div className="font-medium">
                          {student.nextSessionDate 
                            ? new Date(student.nextSessionDate).toLocaleDateString()
                            : 'Not scheduled'
                          }
                        </div>
                      </div>
                    </div>

                    <Progress value={studentProgress} className="h-2" />

                    {/* Session History Summary */}
                    {student.sessionHistory.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Recent Sessions
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {student.sessionHistory
                            .filter(session => session.status === 'completed')
                            .slice(-3)
                            .map((session, sessionIndex) => (
                              <div 
                                key={sessionIndex} 
                                className="text-xs bg-muted/50 p-2 rounded flex justify-between"
                              >
                                <span>Session {session.sessionNumber}</span>
                                <span>{new Date(session.date).toLocaleDateString()}</span>
                                {session.actualMinutes && (
                                  <span className="text-primary">{session.actualMinutes}min</span>
                                )}
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}

                    {index < family.students.length - 1 && <Separator />}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between gap-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={exportReport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};