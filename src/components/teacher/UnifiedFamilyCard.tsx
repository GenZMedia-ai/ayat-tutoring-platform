
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Phone, CheckCircle, User, BarChart3, Calendar } from 'lucide-react';
import { PaidStudent, FamilyCardData } from '@/hooks/useTeacherPaidStudents';
import { StudentSessionActions } from './StudentSessionActions';
import { FamilyReportModal } from './FamilyReportModal';

interface UnifiedFamilyCardProps {
  family: FamilyCardData | import('@/hooks/useTeacherActiveStudents').ActiveFamilyGroup;
  mode: 'registration' | 'progress';
  onScheduleStudent?: (student: PaidStudent | import('@/hooks/useTeacherActiveStudents').StudentProgress) => void;
  onContact: (phone: string, name: string) => void;
  onEditSession?: (sessionData: any, studentName: string, studentId: string) => void;
  onWhatsAppContact?: (phone: string, name: string) => void;
}

export const UnifiedFamilyCard: React.FC<UnifiedFamilyCardProps> = ({
  family,
  mode = 'registration',
  onScheduleStudent,
  onContact,
  onEditSession,
  onWhatsAppContact
}) => {
  const [showFamilyReport, setShowFamilyReport] = useState(false);
  // Handle both registration and progress mode data structures
  const isRegistrationMode = mode === 'registration';
  const progressPercentage = isRegistrationMode 
    ? (family.totalStudents > 0 ? ((family as any).scheduledStudents / family.totalStudents) * 100 : 0)
    : (family.totalSessions > 0 ? ((family as any).completedSessions / family.totalSessions) * 100 : 0);

  const formatPaymentDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg text-primary">{family.familyName}</h3>
              </div>
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                Family
              </Badge>
            </div>
            
            {/* Payment Date */}
            {isRegistrationMode && (family as any).paymentDate && (
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Paid at {formatPaymentDate((family as any).paymentDate)}</span>
              </div>
            )}
            
            {/* Progress Bar */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">
                    {isRegistrationMode ? 'Sessions Scheduled' : 'Overall Progress'}
                  </span>
                  <span className="font-medium text-primary">
                    {isRegistrationMode 
                      ? `${(family as any).scheduledStudents}/${family.totalStudents}`
                      : `${(family as any).completedSessions}/${family.totalSessions}`
                    }
                  </span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-2 animate-fade-in"
                />
                
                {/* Total Sessions for Family (shown once) */}
                {isRegistrationMode && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>Total: {family.totalSessions} sessions</span>
                  </div>
                )}
                
                {!isRegistrationMode && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>{(family as any).totalMinutes} minutes completed</span>
                    {(family as any).nextFamilySession && (
                      <span>Next: {(family as any).nextFamilySession.studentName}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Students List */}
        <div className="space-y-3 animate-fade-in">
          {family.students.map((student, index) => (
            <div 
              key={student.id || student.studentId} 
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors duration-200"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground">
                      {student.name || (student as any).studentName}
                    </h4>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Age: {student.age}</div>
                    {isRegistrationMode ? (
                      <div>{student.packageName || 'Standard Package'}</div>
                    ) : (
                      <div>{(student as any).completedPaidSessions}/${(student as any).totalPaidSessions} completed • {(student as any).totalMinutes}min</div>
                    )}
                  </div>
                  {!isRegistrationMode && (student as any).nextSessionDate && (
                    <p className="text-xs text-primary font-medium mt-1">
                      Next: {new Date((student as any).nextSessionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isRegistrationMode ? (
                  student.isScheduled || student.hasCompletedRegistration ? (
                    <div className="flex items-center gap-2 text-green-600 animate-scale-in">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Sessions Scheduled</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onScheduleStudent?.(student)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground hover-scale"
                    >
                      Schedule Sessions
                    </Button>
                  )
                ) : (
                  <div className="flex items-center gap-2">
                    <StudentSessionActions
                      student={student as any}
                      onEditSession={onEditSession}
                      onViewHistory={(studentId) => console.log('View history for:', studentId)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Button */}
        <div className="pt-3 border-t border-primary/10">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onWhatsAppContact ? onWhatsAppContact(family.parentPhone, family.parentName) : onContact(family.parentPhone, family.parentName)}
              className="flex-1 border-primary/30 text-primary hover:bg-primary/5 hover-scale pulse"
            >
              <Phone className="h-4 w-4 mr-2" />
              Contact {family.parentName}
            </Button>
            {!isRegistrationMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFamilyReport(true)}
                className="border-secondary/30 text-secondary hover:bg-secondary/5 hover-scale"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Family Report
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Family Report Modal */}
      {!isRegistrationMode && showFamilyReport && (
        <FamilyReportModal
          family={family as import('@/hooks/useTeacherActiveStudents').ActiveFamilyGroup}
          open={showFamilyReport}
          onClose={() => setShowFamilyReport(false)}
        />
      )}
    </Card>
  );
};

// Individual Student Card (for non-family students)
interface IndividualStudentCardProps {
  student: PaidStudent;
  onScheduleStudent: (student: PaidStudent) => void;
  onContact: (phone: string, name: string) => void;
}

export const IndividualStudentCard: React.FC<IndividualStudentCardProps> = ({
  student,
  onScheduleStudent,
  onContact
}) => {
  const formatPaymentDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-secondary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-secondary" />
            <div>
              <h3 className="font-semibold text-lg text-secondary">{student.name}</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Age: {student.age}</div>
                <div>{student.packageSessionCount} sessions</div>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-secondary/30 text-secondary">
            Individual
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Paid at {formatPaymentDate(student.paymentDate)}</span>
          </div>
          <p className="text-sm">
            <strong>Package:</strong> {student.packageName}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onScheduleStudent(student)}
            className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          >
            Schedule Sessions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onContact(student.phone, student.name)}
            className="border-secondary/30 text-secondary hover:bg-secondary/5"
          >
            <Phone className="h-4 w-4 mr-2" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
