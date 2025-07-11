
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Phone, CheckCircle, User, BarChart3, Calendar, GraduationCap } from 'lucide-react';
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
    <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary/40 bg-gradient-to-br from-background via-background to-primary/5 hover:to-primary/10">
      <CardHeader className="pb-4 space-y-4">
        {/* Header Section with Brand Colors */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Title Row with Brand Icon */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors duration-300">
                    {family.familyName}
                  </h3>
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors duration-300">
                    Family
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {family.totalStudents} {family.totalStudents === 1 ? 'student' : 'students'}
                </p>
              </div>
            </div>
            
            {/* Payment Date with Consistent Styling */}
            {isRegistrationMode && (family as any).paymentDate && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg border border-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Paid at {formatPaymentDate((family as any).paymentDate)}
                </span>
              </div>
            )}
            
            {/* Progress Section with Brand Colors */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">
                  {isRegistrationMode ? 'Sessions Scheduled' : 'Overall Progress'}
                </span>
                <span className="font-semibold text-primary px-2 py-1 bg-primary/10 rounded-md">
                  {isRegistrationMode 
                    ? `${(family as any).scheduledStudents}/${family.totalStudents}`
                    : `${(family as any).completedSessions}/${family.totalSessions}`
                  }
                </span>
              </div>
              <Progress 
                value={progressPercentage} 
                className="h-3 bg-primary/5 rounded-full overflow-hidden"
              />
              
              {/* Additional Progress Info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {isRegistrationMode ? (
                  <span>Total: {family.totalSessions} sessions</span>
                ) : (
                  <>
                    <span>{(family as any).totalMinutes} minutes completed</span>
                    {(family as any).nextFamilySession && (
                      <span>Next: {(family as any).nextFamilySession.studentName}</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Students List with Enhanced Design */}
        <div className="space-y-3">
          {family.students.map((student, index) => (
            <div 
              key={student.id || student.studentId} 
              className="group/student flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-primary/5 hover:border-primary/20 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 group-hover/student:bg-primary/15 transition-colors duration-300">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-foreground group-hover/student:text-primary transition-colors duration-300">
                    {student.name || (student as any).studentName}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="px-2 py-1 bg-muted/50 rounded-md">Age: {student.age}</span>
                    {isRegistrationMode ? (
                      <span className="px-2 py-1 bg-muted/50 rounded-md">
                        {student.packageName || 'Standard Package'}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-muted/50 rounded-md">
                        {(student as any).completedPaidSessions}/{(student as any).totalPaidSessions} sessions • {(student as any).totalMinutes}min
                      </span>
                    )}
                  </div>
                  {!isRegistrationMode && (student as any).nextSessionDate && (
                    <p className="text-xs text-primary font-medium">
                      Next: {new Date((student as any).nextSessionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Action Button */}
              <div>
                {isRegistrationMode ? (
                  student.isScheduled || student.hasCompletedRegistration ? (
                    <div className="flex items-center gap-2 text-green-600 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Scheduled</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onScheduleStudent?.(student)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-md transition-all duration-300"
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Schedule Sessions
                    </Button>
                  )
                ) : (
                  <StudentSessionActions
                    student={student as any}
                    onEditSession={onEditSession}
                    onViewHistory={(studentId) => console.log('View history for:', studentId)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Actions with Brand Styling */}
        <div className="pt-4 border-t border-border/50">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onWhatsAppContact ? onWhatsAppContact(family.parentPhone, family.parentName) : onContact(family.parentPhone, family.parentName)}
              className="flex-1 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 group/btn"
            >
              <Phone className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
              Contact {family.parentName}
            </Button>
            {!isRegistrationMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFamilyReport(true)}
                className="border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 group/btn"
              >
                <BarChart3 className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
                Report
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

// Individual Student Card with Unified Design
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
    <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary/40 bg-gradient-to-br from-background via-background to-primary/5 hover:to-primary/10">
      <CardHeader className="pb-4 space-y-4">
        {/* Header Section with Brand Colors */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Title Row with Brand Icon */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors duration-300">
                    {student.name}
                  </h3>
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors duration-300">
                    Individual
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="px-2 py-1 bg-muted/50 rounded-md">Age: {student.age}</span>
                  <span className="px-2 py-1 bg-muted/50 rounded-md">{student.packageSessionCount} sessions</span>
                </div>
              </div>
            </div>
            
            {/* Payment Date with Consistent Styling */}
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg border border-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Paid at {formatPaymentDate(student.paymentDate)}
              </span>
            </div>
            
            {/* Package Info */}
            <div className="px-3 py-2 bg-muted/30 rounded-lg border border-border">
              <p className="text-sm">
                <strong className="text-foreground">Package:</strong> 
                <span className="text-muted-foreground ml-2">{student.packageName}</span>
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Action Buttons with Brand Styling */}
        <div className="flex gap-3">
          <Button
            size="sm"
            onClick={() => onScheduleStudent(student)}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-md transition-all duration-300 group/btn"
          >
            <GraduationCap className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
            Schedule Sessions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onContact(student.phone, student.name)}
            className="border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 group/btn"
          >
            <Phone className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
