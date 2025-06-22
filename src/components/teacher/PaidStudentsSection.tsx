
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Calendar, User } from 'lucide-react';
import { usePaidStudents } from '@/hooks/usePaidStudents';
import { useAuth } from '@/contexts/AuthContext';
import { RegistrationModal } from './RegistrationModal';
import { WhatsAppContactButton } from './WhatsAppContactButton';

export const PaidStudentsSection: React.FC = () => {
  const { user } = useAuth();
  const { data: paidStudents = [], isLoading } = usePaidStudents(user?.id);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading paid students...</div>;
  }

  if (paidStudents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Paid Students - Registration Required
          </CardTitle>
          <CardDescription>
            Students who have completed payment and need session scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No paid students requiring registration at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Paid Students - Registration Required
        </h3>
        <Badge variant="outline">{paidStudents.length} students</Badge>
      </div>

      <div className="grid gap-4">
        {paidStudents.map((student) => (
          <Card key={student.id} className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{student.name}</CardTitle>
                  <CardDescription>
                    {student.unique_id} • Age: {student.age} • {student.country}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-green-600">Paid</Badge>
                  <Badge variant="outline">
                    {student.package_session_count} Sessions
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Phone:</span> {student.phone}
                </div>
                <div>
                  <span className="font-medium">Platform:</span> {student.platform}
                </div>
                <div>
                  <span className="font-medium">Package:</span> {student.package_session_count} sessions
                </div>
                <div>
                  <span className="font-medium">Purchased:</span>{' '}
                  {new Date(student.package_purchased_at).toLocaleDateString()}
                </div>
                {student.parent_name && (
                  <div className="md:col-span-2">
                    <span className="font-medium">Parent:</span> {student.parent_name}
                  </div>
                )}
              </div>

              {student.notes && (
                <div className="p-3 bg-muted rounded-md">
                  <span className="font-medium text-sm">Notes:</span>
                  <p className="text-sm mt-1">{student.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <WhatsAppContactButton
                  studentId={student.id}
                  phone={student.phone}
                  studentName={student.name}
                  contactType="package_purchased"
                  customMessage={`Congratulations ${student.name}! Your package has been confirmed. Let's schedule your ${student.package_session_count} sessions. When would be a good time to discuss the schedule?`}
                  className="flex-1"
                  variant="outline"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Student
                </WhatsAppContactButton>
                
                <Button
                  size="sm"
                  onClick={() => setSelectedStudent(student)}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Complete Registration
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedStudent && (
        <RegistrationModal
          student={selectedStudent}
          open={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};
