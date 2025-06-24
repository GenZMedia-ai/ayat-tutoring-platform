
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTeacherPaidStudents } from '@/hooks/useTeacherPaidStudents';
import { useWhatsAppContact } from '@/hooks/useWhatsAppContact';
import { SmartSchedulingModal } from './SmartSchedulingModal';
import { MinimalStudentCard } from './MinimalStudentCard';
import { LoadingSpinner } from './LoadingSpinner';
import { DateRange } from '@/components/teacher/DateFilter';
import { DollarSign, GraduationCap } from 'lucide-react';

interface PaidStudentsSectionProps {
  dateRange?: DateRange;
}

const PaidStudentsSection: React.FC<PaidStudentsSectionProps> = ({ dateRange = 'today' }) => {
  const { paidStudents, loading, refreshPaidStudents } = useTeacherPaidStudents();
  const { openWhatsApp, logContact } = useWhatsAppContact();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Filter students based on date range
  const filteredStudents = React.useMemo(() => {
    if (!dateRange || dateRange === 'all-time') return paidStudents;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return paidStudents.filter(student => {
      if (!student.paymentDate) return false;
      
      const paymentDate = new Date(student.paymentDate);
      const paymentDay = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
      
      switch (dateRange) {
        case 'today':
          return paymentDay.getTime() === today.getTime();
        case 'yesterday': {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return paymentDay.getTime() === yesterday.getTime();
        }
        case 'last-7-days': {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - 6);
          return paymentDay >= weekStart && paymentDay <= today;
        }
        case 'this-month': {
          return paymentDay.getMonth() === today.getMonth() && 
                 paymentDay.getFullYear() === today.getFullYear();
        }
        case 'last-month': {
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
          return paymentDay >= lastMonth && paymentDay <= lastMonthEnd;
        }
        default:
          return true;
      }
    });
  }, [paidStudents, dateRange]);

  const handleContactStudent = async (studentId: string, phone: string) => {
    try {
      openWhatsApp(phone);
      await logContact(studentId, 'follow_up', true, 'WhatsApp contact for registration setup');
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

  const getDateRangeDisplayText = (range: DateRange) => {
    switch (range) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'last-7-days': return 'Last 7 Days';
      case 'this-month': return 'This Month';
      case 'last-month': return 'Last Month';
      case 'all-time': return 'All Time';
      case 'custom': return 'Custom Range';
      default: return 'All Time';
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Students Awaiting Schedule Setup
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
            Students Awaiting Schedule Setup
            {dateRange && dateRange !== 'all-time' && (
              <Badge variant="outline" className="ml-2 border-primary/20 text-primary">
                {getDateRangeDisplayText(dateRange)}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Students who have completed payment and need their session schedule configured
            {filteredStudents.length !== paidStudents.length && (
              <span className="block mt-1 text-primary font-medium">
                Showing {filteredStudents.length} of {paidStudents.length} students
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mx-auto mb-4">
                <GraduationCap className="h-8 w-8 text-slate-400 mx-auto" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium mb-2">
                {paidStudents.length === 0 
                  ? "No students awaiting schedule setup" 
                  : `No students found for ${getDateRangeDisplayText(dateRange).toLowerCase()}`
                }
              </p>
              <p className="text-sm text-slate-500">
                {paidStudents.length === 0 
                  ? "New paid students will appear here for session scheduling"
                  : "Try adjusting the date filter to see more students"
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <MinimalStudentCard
                  key={student.id}
                  student={student}
                  onContact={() => handleContactStudent(student.id, student.phone)}
                  onCompleteRegistration={() => handleCompleteRegistration(student)}
                />
              ))}
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
