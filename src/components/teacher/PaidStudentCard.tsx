
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Phone, 
  MapPin, 
  User, 
  CheckCircle,
  MessageCircle,
  Settings
} from 'lucide-react';
import { PaidStudent } from '@/hooks/usePaidStudents';
import WhatsAppContactButton from './WhatsAppContactButton';
import { format } from 'date-fns';

interface PaidStudentCardProps {
  student: PaidStudent;
  onCompleteRegistration: (student: PaidStudent) => void;
}

export const PaidStudentCard: React.FC<PaidStudentCardProps> = ({
  student,
  onCompleteRegistration
}) => {
  const getStatusBadge = (status: string) => {
    if (status === 'paid') {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-0">
          Paid - Needs Registration
        </Badge>
      );
    }
    if (status === 'active') {
      return (
        <Badge className="bg-green-100 text-green-800 border-0">
          Active - {student.completed_sessions}/{student.package_session_count} Sessions
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getProgressPercentage = () => {
    if (student.package_session_count === 0) return 0;
    return Math.round((student.completed_sessions / student.package_session_count) * 100);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">{student.name}</h3>
              {getStatusBadge(student.status)}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{student.unique_id}</span>
              <span>Age: {student.age}</span>
              {student.parent_name && (
                <span>Parent: {student.parent_name}</span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{student.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{student.country}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{student.platform}</span>
            </div>
          </div>

          <div className="space-y-2">
            {student.package_purchased_at && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Paid: {format(new Date(student.package_purchased_at), 'MMM dd, yyyy')}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>{student.package_session_count} Session Package</span>
            </div>
            {student.status === 'active' && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Progress: {getProgressPercentage()}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Registration Status */}
        {student.registration_completed_at && (
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Registration Complete</span>
            </div>
            <p className="text-sm text-green-700">
              Sessions scheduled on {format(new Date(student.registration_completed_at), 'MMM dd, yyyy')}
            </p>
          </div>
        )}

        {/* Notes */}
        {student.notes && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Notes:</strong> {student.notes}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <WhatsAppContactButton
            student={{
              id: student.id,
              name: student.name,
              phone: student.phone,
              uniqueId: student.unique_id,
              age: student.age,
              country: student.country,
              platform: student.platform as 'zoom' | 'google-meet',
              teacherType: 'kids',
              status: student.status as any,
              assignedSalesAgent: '',
              createdAt: student.created_at,
              updatedAt: student.updated_at,
              trialDate: undefined,
              trialTime: undefined
            }}
            contactType="follow_up"
            variant="outline"
            size="sm"
          />
          
          {student.status === 'paid' && !student.registration_completed_at && (
            <Button
              onClick={() => onCompleteRegistration(student)}
              className="flex-1"
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Complete Registration
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
