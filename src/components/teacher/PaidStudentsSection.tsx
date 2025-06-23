
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTeacherPaidStudents } from '@/hooks/useTeacherPaidStudents';
import { useWhatsAppContact } from '@/hooks/useWhatsAppContact';
import { CompleteRegistrationModal } from './CompleteRegistrationModal';
import { LoadingSpinner } from './LoadingSpinner';
import { DateRange } from '@/components/teacher/DateFilter';
import { Calendar, Clock, DollarSign, Phone, User } from 'lucide-react';

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
      await logContact(studentId, 'follow_up', true, 'WhatsApp contact for payment confirmation');
      await refreshPaidStudents();
    } catch (error) {
      console.error('Error handling contact:', error);
    }
  };

  const handleCompleteRegistration = (student: any) => {
    console.log('🎯 Opening registration modal for student:', student.name);
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
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Paid Students Requiring Registration</CardTitle>
          <CardDescription>Students who have paid and need session scheduling</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2 text-muted-foreground">Loading paid students...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Paid Students Requiring Registration
            {dateRange && dateRange !== 'all-time' && (
              <Badge variant="outline" className="ml-2">
                {getDateRangeDisplayText(dateRange)}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Students who have paid and need their complete session schedule set up
            {filteredStudents.length !== paidStudents.length && (
              <span className="block mt-1">
                Showing {filteredStudents.length} of {paidStudents.length} paid students
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-lg font-medium">
                {paidStudents.length === 0 
                  ? "No paid students requiring registration" 
                  : `No paid students found for ${getDateRangeDisplayText(dateRange).toLowerCase()}`
                }
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {paidStudents.length === 0 
                  ? "Students will appear here after payment confirmation"
                  : "Try adjusting the date filter to see more students"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div key={student.id} className="p-4 border border-border rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium text-lg">{student.name}</h4>
                        <Badge className="bg-green-100 text-green-800 border-green-200">PAID</Badge>
                        {student.paymentDate && (
                          <Badge variant="outline" className="text-xs">
                            Paid: {new Date(student.paymentDate).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Age:</span>
                          <span className="font-medium">{student.age}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{student.packageSessionCount} sessions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {student.paymentAmount} {student.paymentCurrency?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Platform:</span>
                          <span className="font-medium capitalize">{student.platform}</span>
                        </div>
                      </div>
                      
                      {student.parentName && (
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-muted-foreground">Parent:</span>
                          <span className="font-medium">{student.parentName}</span>
                        </div>
                      )}
                      
                      {student.notes && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="mt-1 text-gray-700 dark:text-gray-300">{student.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => handleContactStudent(student.id, student.phone)}
                      >
                        <Phone className="h-3 w-3" />
                        Contact
                      </Button>
                      <Button 
                        size="sm"
                        className="ayat-button-primary flex items-center gap-1"
                        onClick={() => handleCompleteRegistration(student)}
                      >
                        <Clock className="h-3 w-3" />
                        Complete Registration
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CompleteRegistrationModal
        student={selectedStudent}
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onSuccess={handleRegistrationSuccess}
      />
    </>
  );
};

export default PaidStudentsSection;
