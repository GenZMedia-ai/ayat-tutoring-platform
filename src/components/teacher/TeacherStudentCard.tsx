import React, { useEffect, useState } from 'react';
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
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TrialStudent } from '@/hooks/useTeacherTrialSessions';
import { formatDateTimeInEgypt } from '@/utils/egyptTimezone';
import { supabase } from '@/integrations/supabase/client';

const EGYPT_TIMEZONE = 'Africa/Cairo';

interface TeacherStudentCardProps {
  student: TrialStudent;
  onContact: (studentId: string, phone: string) => void;
  onConfirm: (studentId: string) => void;
  onMarkCompleted: (student: TrialStudent) => void;
  onMarkGhosted: (student: TrialStudent) => void;
  onReschedule: (student: TrialStudent) => void;
}

interface RescheduleInfo {
  rescheduleCount: number;
  originalDate?: string;
  originalTime?: string;
  rescheduleReason?: string;
}

export const TeacherStudentCard: React.FC<TeacherStudentCardProps> = ({
  student,
  onContact,
  onConfirm,
  onMarkCompleted,
  onMarkGhosted,
  onReschedule
}) => {
  const [rescheduleInfo, setRescheduleInfo] = useState<RescheduleInfo | null>(null);

  // Log session ID for debugging
  console.log('🎯 Student card rendered with session ID:', {
    studentName: student.name,
    studentId: student.id,
    sessionId: student.sessionId
  });

  // Fetch reschedule information
  useEffect(() => {
    const fetchRescheduleInfo = async () => {
      try {
        const { data: sessionStudents } = await supabase
          .from('session_students')
          .select('session_id')
          .eq('student_id', student.id);

        if (sessionStudents && sessionStudents.length > 0) {
          const sessionIds = sessionStudents.map(ss => ss.session_id);
          const { data: sessionData } = await supabase
            .from('sessions')
            .select('reschedule_count, original_date, original_time, reschedule_reason')
            .in('id', sessionIds)
            .order('created_at', { ascending: false })
            .limit(1);

          if (sessionData && sessionData.length > 0) {
            const session = sessionData[0];
            if (session.reschedule_count > 0) {
              setRescheduleInfo({
                rescheduleCount: session.reschedule_count,
                originalDate: session.original_date,
                originalTime: session.original_time,
                rescheduleReason: session.reschedule_reason
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching reschedule info:', error);
      }
    };

    fetchRescheduleInfo();
  }, [student.id]);

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

  // FIXED: Use Egypt timezone formatting for consistent display
  const formatDateTime = (date?: string, time?: string) => {
    console.log('🔄 FIXED: Formatting date/time in Egypt timezone:', { date, time });
    return formatDateTimeInEgypt(date, time, "dd/MM/yyyy 'at' h:mm a");
  };

  const formatOriginalDateTime = (date?: string, time?: string) => {
    console.log('🔄 FIXED: Formatting original date/time in Egypt timezone:', { date, time });
    return formatDateTimeInEgypt(date, time, "dd/MM 'at' h:mm a");
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
      const canMarkOutcome = !!student.sessionId;
      
      if (canMarkOutcome) {
        options.push(
          { label: 'Mark as Completed', action: () => onMarkCompleted(student), icon: CheckCircle },
          { label: 'Mark as Ghosted', action: () => onMarkGhosted(student), icon: XCircle }
        );
      } else {
        console.warn('⚠️ Cannot mark outcome - no session ID for student:', student.name);
      }
      
      options.push(
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
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="font-semibold text-lg">{student.name}</h3>
              {getStatusBadge(student.status)}
              {rescheduleInfo && rescheduleInfo.rescheduleCount > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 border-0">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Rescheduled ({rescheduleInfo.rescheduleCount}x)
                </Badge>
              )}
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
            <div className="flex flex-col">
              <span className="font-medium">
                {formatDateTime(student.trialDate, student.trialTime)}
              </span>
              {rescheduleInfo && rescheduleInfo.originalDate && rescheduleInfo.originalTime && (
                <span className="text-xs text-muted-foreground">
                  Originally: {formatOriginalDateTime(rescheduleInfo.originalDate, rescheduleInfo.originalTime)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Reschedule Information */}
        <div className={`p-3 bg-yellow-50 border border-yellow-200 rounded-lg ${(!rescheduleInfo || rescheduleInfo.rescheduleCount === 0) ? 'invisible' : ''}`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">
                Session Rescheduled {rescheduleInfo?.rescheduleCount || 0} time{(rescheduleInfo?.rescheduleCount || 0) > 1 ? 's' : ''}
              </p>
              {rescheduleInfo?.rescheduleReason && (
                <p className="text-yellow-700 mt-1">
                  Reason: {rescheduleInfo.rescheduleReason.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className={`p-3 bg-muted rounded-lg ${!student.notes ? 'invisible' : ''}`}>
          <p className="text-sm">
            <strong>Notes:</strong> {student.notes || 'No notes available'}
          </p>
        </div>

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
