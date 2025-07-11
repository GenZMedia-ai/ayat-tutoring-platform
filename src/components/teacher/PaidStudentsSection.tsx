
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeacherPaidStudents, PaidStudentItem, PaidStudent, FamilyCardData } from '@/hooks/useTeacherPaidStudents';
import { useWhatsAppContact } from '@/hooks/useWhatsAppContact';
import { SmartSchedulingModal } from './SmartSchedulingModal';
import { UnifiedFamilyCard, IndividualStudentCard } from './UnifiedFamilyCard';
import { LoadingSpinner } from './LoadingSpinner';
import { GraduationCap } from 'lucide-react';

const PaidStudentsSection: React.FC = () => {
  const { paidStudents, loading, refreshPaidStudents } = useTeacherPaidStudents();
  const { openWhatsApp, logContact } = useWhatsAppContact();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Type guards
  const isIndividualStudent = (item: PaidStudentItem): item is PaidStudent => {
    return !('type' in item) || (item as any).type !== 'family';
  };

  const isFamilyCard = (item: PaidStudentItem): item is FamilyCardData => {
    return 'type' in item && (item as FamilyCardData).type === 'family';
  };

  const handleContactStudent = async (phone: string, name: string, studentId?: string) => {
    try {
      openWhatsApp(phone);
      if (studentId) {
        await logContact(studentId, 'follow_up', true, 'WhatsApp contact for registration setup');
      }
      await refreshPaidStudents();
    } catch (error) {
      console.error('Error handling contact:', error);
    }
  };

  const handleCompleteRegistration = (student: any) => {
    console.log('🎯 Opening smart scheduling modal for student:', {
      name: student.name,
      sessionCount: student.packageSessionCount,
      isFamilyMember: student.isFamilyMember
    });
    setSelectedStudent(student);
  };

  const handleRegistrationSuccess = () => {
    console.log('✅ Registration completed successfully');
    setSelectedStudent(null);
    refreshPaidStudents();
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Students Pending Scheduling
          </CardTitle>
          <CardDescription>Students who have completed payment and need session scheduling</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
            <span className="ml-3 text-muted-foreground">Loading students...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            Students Pending Scheduling
          </CardTitle>
          <CardDescription>
            Students and families who have completed payment and need their session schedules configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paidStudents.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mx-auto mb-4">
                <GraduationCap className="h-8 w-8 text-slate-400 mx-auto" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium mb-2">
                No students pending scheduling
              </p>
              <p className="text-sm text-slate-500">
                New paid students will appear here for session scheduling
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {paidStudents.map((item) => {
                if (isFamilyCard(item)) {
                  return (
                    <UnifiedFamilyCard
                      key={item.id}
                      family={item}
                      mode="registration"
                      onScheduleStudent={handleCompleteRegistration}
                      onContact={handleContactStudent}
                    />
                  );
                } else {
                  return (
                    <IndividualStudentCard
                      key={item.id}
                      student={item}
                      onScheduleStudent={handleCompleteRegistration}
                      onContact={(phone, name) => handleContactStudent(phone, name, item.id)}
                    />
                  );
                }
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <SmartSchedulingModal
        student={selectedStudent}
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onSuccess={handleRegistrationSuccess}
      />
    </>
  );
};

export default PaidStudentsSection;
