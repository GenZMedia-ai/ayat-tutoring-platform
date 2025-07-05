import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Phone, CheckCircle, User } from 'lucide-react';
import { PaidStudent, FamilyCardData } from '@/hooks/useTeacherPaidStudents';

interface UnifiedFamilyCardProps {
  family: FamilyCardData;
  mode: 'registration' | 'progress';
  onScheduleStudent: (student: PaidStudent) => void;
  onContact: (phone: string, name: string) => void;
}

export const UnifiedFamilyCard: React.FC<UnifiedFamilyCardProps> = ({
  family,
  mode = 'registration',
  onScheduleStudent,
  onContact
}) => {
  const progressPercentage = family.totalStudents > 0 
    ? (family.scheduledStudents / family.totalStudents) * 100 
    : 0;

  const getStudentIcon = (age: number) => {
    if (age <= 6) return '👶';
    if (age <= 10) return '👧';
    return '👦';
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
            
            {/* Progress Bar */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Sessions Scheduled</span>
                  <span className="font-medium text-primary">
                    {family.scheduledStudents}/{family.totalStudents}
                  </span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-2"
                />
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Students List */}
        <div className="space-y-3">
          {family.students.map((student) => (
            <div 
              key={student.id} 
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-lg">{getStudentIcon(student.age)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground">{student.name}</h4>
                    <span className="text-sm text-muted-foreground">({student.age})</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {student.packageSessionCount} sessions • {student.packageName}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {student.isScheduled || student.hasCompletedRegistration ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Sessions Scheduled</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onScheduleStudent(student)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Schedule Sessions
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Button */}
        <div className="pt-3 border-t border-primary/10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onContact(family.parentPhone, family.parentName)}
            className="w-full border-primary/30 text-primary hover:bg-primary/5"
          >
            <Phone className="h-4 w-4 mr-2" />
            Contact Parent: {family.parentName}
          </Button>
        </div>
      </CardContent>
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
  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-secondary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-secondary" />
            <div>
              <h3 className="font-semibold text-lg text-secondary">{student.name}</h3>
              <p className="text-sm text-muted-foreground">
                Age {student.age} • {student.packageSessionCount} sessions
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-secondary/30 text-secondary">
            Individual
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm">
            <strong>Package:</strong> {student.packageName}
          </p>
          <p className="text-sm">
            <strong>Parent:</strong> {student.parentName || 'Not specified'}
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
            <Phone className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};