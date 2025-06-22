
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PaidStudentsSection from '@/components/teacher/PaidStudentsSection';
import { DollarSign, Users, Calendar } from 'lucide-react';

const TeacherPaidRegistration: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="h-6 w-6 text-green-600" />
        <div>
          <h2 className="text-2xl font-bold">Paid Student Registration</h2>
          <p className="text-muted-foreground">
            Complete registration for students who have paid and need session scheduling
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Registration Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <p>1. Contact student via WhatsApp</p>
              <p>2. Discuss session schedule</p>
              <p>3. Complete registration form</p>
              <p>4. System activates student</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Session Scheduling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <p>• Schedule ALL package sessions</p>
              <p>• Set specific dates and times</p>
              <p>• System creates session calendar</p>
              <p>• Reminders auto-configured</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <p className="text-green-600">PAID → Registration</p>
              <p className="text-blue-600">ACTIVE → Teaching</p>
              <p className="text-gray-600">EXPIRED → Renewal</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <PaidStudentsSection />
    </div>
  );
};

export default TeacherPaidRegistration;
