
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Users, Calendar, RefreshCw } from 'lucide-react';
import { usePaidStudents } from '@/hooks/usePaidStudents';
import { PaidStudentCard } from './PaidStudentCard';
import { RegistrationModal } from './RegistrationModal';
import { toast } from 'sonner';

export const PaidStudentsSection: React.FC = () => {
  const { paidStudents, loading, error, fetchPaidStudents, completeRegistration } = usePaidStudents();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);

  const handleCompleteRegistration = (student: any) => {
    setSelectedStudent(student);
    setRegistrationModalOpen(true);
  };

  const handleRegistrationComplete = async (studentId: string, sessions: any[]) => {
    try {
      await completeRegistration(studentId, sessions);
      setRegistrationModalOpen(false);
      setSelectedStudent(null);
      toast.success('Registration completed successfully!');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const paidCount = paidStudents.filter(s => s.status === 'paid').length;
  const activeCount = paidStudents.filter(s => s.status === 'active').length;

  if (loading) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Paid Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading paid students...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Paid Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={fetchPaidStudents} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Paid Students
              </CardTitle>
              <CardDescription>
                Students who have completed payment and need registration or are active
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-purple-600">
                {paidCount} Need Registration
              </Badge>
              <Badge variant="outline" className="text-green-600">
                {activeCount} Active
              </Badge>
              <Button onClick={fetchPaidStudents} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paidStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No Paid Students
              </h3>
              <p className="text-sm text-muted-foreground">
                Students who have completed payment will appear here for registration
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {paidStudents.map((student) => (
                <PaidStudentCard
                  key={student.id}
                  student={student}
                  onCompleteRegistration={handleCompleteRegistration}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RegistrationModal
        student={selectedStudent}
        open={registrationModalOpen}
        onClose={() => {
          setRegistrationModalOpen(false);
          setSelectedStudent(null);
        }}
        onComplete={handleRegistrationComplete}
      />
    </>
  );
};
