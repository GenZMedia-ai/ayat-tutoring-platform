
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
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TrialStudent } from '@/hooks/useTeacherTrialSessions';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { supabase } from '@/integrations/supabase/client';
import TrialOutcomeForm from './TrialOutcomeForm';

const EGYPT_TIMEZONE = 'Africa/Cairo';

interface TeacherStudentCardProps {
  student: TrialStudent;
  onContact: (studentId: string, phone: string) => void;
  onConfirm: (studentId: string) => void;
  onStatusChange: (studentId: string, newStatus: string) => void;
  onReschedule: (student: TrialStudent) => void;
  onTrialOutcomeSubmitted?: () => void;
}

interface RescheduleInfo {
  rescheduleCount: number;
  originalDate?: string;
  originalTime?: string;
  rescheduleReason?: string;
}

interface SessionInfo {
  sessionId: string;
  studentId: string;
}

export const TeacherStudentCard: React.FC<TeacherStudentCardProps> = ({
  student,
  onContact,
  onConfirm,
  onStatusChange,
  onReschedule,
  onTrialOutcomeSubmitted
}) => {
  const [rescheduleInfo, setRescheduleInfo] = useState<RescheduleInfo | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isTrialOutcomeModalOpen, setIsTrialOutcomeModalOpen] = useState(false);

  // Fetch reschedule information and session data
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const { data: sessionStudents } = await supabase
          .from('session_students')
          .select('session_id')
          .eq('student_id', student.id);

        if (sessionStudents && sessionStudents.length > 0) {
          const sessionIds = sessionStudents.map(ss => ss.session_id);
          const { data: sessionData } = await supabase
            .from('sessions')
            .select('id, reschedule_count, original_date, original_time, reschedule_reason, scheduled_date, scheduled_time')
            .in('id', sessionIds)
            .order('created_at', { ascending: false })
            .limit(1);

          if (sessionData && sessionData.length > 0) {
            const session = sessionData[0];
            
            // Set session info for trial outcome form
            setSessionInfo({
              sessionId: session.id,
              studentId: student.id
            });

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
        console.error('Error fetching session data:', error);
      }
    };

    fetchSessionData();
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

  const formatDateTime = (date?: string, time?: string) => {
    if (!date || !time) return 'Not scheduled';
    
    try {
      console.log('🔄 Formatting date/time:', { date, time });
      
      // Validate input date format (should be YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        console.error('❌ Invalid date format:', date);
        return 'Invalid date format';
      }
      
      // Validate input time format (should be HH:mm:ss)
      if (!/^\d{2}:\d{2}:\d{2}$/.test(time)) {
        console.error('❌ Invalid time format:', time);
        return 'Invalid time format';
      }
      
      // Create UTC datetime string (database stores UTC time)
      const utcDateTimeString = `${date}T${time}Z`;
      console.log('📅 UTC DateTime String:', utcDateTimeString);
      
      // Parse as UTC date
      const utcDateTime = new Date(utcDateTimeString);
      
      // Check if date is valid
      if (isNaN(utcDateTime.getTime())) {
        console.error('❌ Invalid date object:', utcDateTimeString);
        return 'Invalid date';
      }
      
      console.log('🌐 UTC DateTime Object:', utcDateTime.toISOString());
      
      // Convert to Egypt timezone
      const egyptDateTime = toZonedTime(utcDateTime, EGYPT_TIMEZONE);
      console.log('🇪🇬 Egypt DateTime:', egyptDateTime);
      
      // Format in Egyptian format: DD/MM/YYYY at H:mm AM/PM
      const formattedDateTime = format(egyptDateTime, 'dd/MM/yyyy \'at\' h:mm a');
      console.log('✅ Formatted DateTime:', formattedDateTime);
      
      return formattedDateTime;
    } catch (error) {
      console.error('❌ Date formatting error:', error);
      return 'Date formatting error';
    }
  };

  const handleTrialCompleted = () => {
    setIsTrialOutcomeModalOpen(true);
  };

  const handleTrialGhosted = () => {
    setIsTrialOutcomeModalOpen(true);
  };

  const handleTrialOutcomeSuccess = () => {
    setIsTrialOutcomeModalOpen(false);
    onTrialOutcomeSubmitted?.();
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
        { label: 'Mark as Completed', action: handleTrialCompleted, icon: CheckCircle },
        { label: 'Mark as Ghosted', action: handleTrialGhosted, icon: XCircle },
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
    <>
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
              <span className="font-medium">
                {formatDateTime(student.trialDate, student.trialTime)}
              </span>
            </div>
          </div>

          {/* Reschedule Information */}
          {rescheduleInfo && rescheduleInfo.rescheduleCount > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">
                    Session Rescheduled {rescheduleInfo.rescheduleCount} time{rescheduleInfo.rescheduleCount > 1 ? 's' : ''}
                  </p>
                  {rescheduleInfo.rescheduleReason && (
                    <p className="text-yellow-700 mt-1">
                      Reason: {rescheduleInfo.rescheduleReason.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  )}
                </div>
              </div>
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

      {/* Trial Outcome Modal */}
      <Dialog open={isTrialOutcomeModalOpen} onOpenChange={setIsTrialOutcomeModalOpen}>
        <DialogContent className="max-w-3xl">
          {sessionInfo && (
            <TrialOutcomeForm
              student={{
                id: student.id,
                uniqueId: student.uniqueId,
                name: student.name,
                age: student.age,
                phone: student.phone,
                country: student.country,
                platform: 'zoom', // Default platform, this could be enhanced to get actual platform
                notes: student.notes,
                status: student.status as any,
                parentName: student.parentName,
                assignedTeacher: student.assignedTeacher,
                assignedSalesAgent: student.assignedSalesAgent,
                assignedSupervisor: student.assignedSupervisor,
                trialDate: student.trialDate,
                trialTime: student.trialTime,
                teacherType: 'quran' as any, // Default teacher type, this could be enhanced
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }}
              sessionId={sessionInfo.sessionId}
              onSuccess={handleTrialOutcomeSuccess}
              onCancel={() => setIsTrialOutcomeModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
