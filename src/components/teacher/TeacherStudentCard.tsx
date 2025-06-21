
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Phone, 
  MapPin, 
  User, 
  MoreHorizontal,
  MessageCircle,
  Video,
  CheckCircle,
  XCircle,
  RotateCcw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TrialStudent } from '@/hooks/useTeacherTrialSessions';
import { format } from 'date-fns';

interface TeacherStudentCardProps {
  student: TrialStudent;
  onContact: (studentId: string, phone: string) => void;
  onConfirm: (studentId: string) => void;
  onStatusChange: (studentId: string, newStatus: string) => void;
  onReschedule: (student: TrialStudent) => void;
}

export const TeacherStudentCard: React.FC<TeacherStudentCardProps> = ({
  student,
  onContact,
  onConfirm,
  onStatusChange,
  onReschedule
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-orange-100 text-orange-800', label: 'Pending' },
      'confirmed': { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      'trial-completed': { color: 'bg-green-100 text-green-800', label: 'Trial Completed' },
      'trial-ghosted': { color: 'bg-red-100 text-red-800', label: 'Trial Ghosted' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (date?: string, time?: string) => {
    if (!date || !time) return 'Not scheduled';
    try {
      const dateTime = new Date(`${date}T${time}`);
      return format(dateTime, 'MMM dd, yyyy at HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const getMenuOptions = () => {
    const options = [];

    if (student.status === 'pending') {
      options.push(
        { label: 'Contact Student', action: () => onContact(student.id, student.phone), icon: MessageCircle },
        { label: 'Confirm Trial', action: () => onConfirm(student.id), icon: CheckCircle },
        { label: 'Reschedule', action: () => onReschedule(student), icon: RotateCcw }
      );
    } else if (student.status === 'confirmed') {
      options.push(
        { label: 'Mark as Completed', action: () => onStatusChange(student.id, 'trial-completed'), icon: CheckCircle },
        { label: 'Mark as Ghosted', action: () => onStatusChange(student.id, 'trial-ghosted'), icon: XCircle },
        { label: 'Reschedule', action: () => onReschedule(student), icon: RotateCcw },
        { label: 'Contact Student', action: () => onContact(student.id, student.phone), icon: MessageCircle }
      );
    } else {
      options.push(
        { label: 'Contact Student', action: () => onContact(student.id, student.phone), icon: MessageCircle }
      );
    }

    return options;
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
              <span className="font-mono">{student.uniqueId}</span>
              <span>Age: {student.age}</span>
              {student.parentName && (
                <span>Parent: {student.parentName}</span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {getMenuOptions().map((option, index) => (
                <DropdownMenuItem key={index} onClick={option.action}>
                  <option.icon className="mr-2 h-4 w-4" />
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{student.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{student.country}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDateTime(student.trialDate, student.trialTime)}</span>
          </div>
        </div>

        {/* Notes */}
        {student.notes && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Notes:</strong> {student.notes}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        {student.status === 'pending' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onContact(student.id, student.phone)}
            >
              Contact
            </Button>
            <Button 
              size="sm"
              className="ayat-button-primary"
              onClick={() => onConfirm(student.id)}
            >
              Confirm
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
