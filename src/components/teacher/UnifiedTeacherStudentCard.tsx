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
  AlertTriangle,
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TeacherMixedTrialItem, TeacherTrialStudent, TeacherTrialFamily } from '@/hooks/useTeacherMixedTrialData';
import { formatDateTimeInEgypt } from '@/utils/egyptTimezone';
import { supabase } from '@/integrations/supabase/client';

interface UnifiedTeacherStudentCardProps {
  item: TeacherMixedTrialItem;
  onContact: (phone: string, name: string) => void;
  onConfirm: (item: TeacherMixedTrialItem) => void;
  onMarkCompleted: (item: TeacherMixedTrialItem) => void;
  onMarkGhosted: (item: TeacherMixedTrialItem) => void;
  onReschedule: (item: TeacherMixedTrialItem) => void;
  // Phase 3: Add complete registration callback
  onCompleteRegistration?: (item: TeacherMixedTrialItem) => void;
}

interface RescheduleInfo {
  rescheduleCount: number;
  originalDate?: string;
  originalTime?: string;
  rescheduleReason?: string;
}

export const UnifiedTeacherStudentCard: React.FC<UnifiedTeacherStudentCardProps> = ({
  item,
  onContact,
  onConfirm,
  onMarkCompleted,
  onMarkGhosted,
  onReschedule,
  onCompleteRegistration
}) => {
  const [rescheduleInfo, setRescheduleInfo] = useState<RescheduleInfo | null>(null);
  const isFamily = item.type === 'family';
  const data = item.data;

  // Log session ID for debugging
  console.log('🎯 Unified card rendered with item:', {
    type: item.type,
    name: isFamily ? (data as TeacherTrialFamily).parentName : (data as TeacherTrialStudent).name,
    id: item.id,
    sessionId: data.sessionId
  });

  useEffect(() => {
    const fetchRescheduleInfo = async () => {
      try {
        let sessionIds: string[] = [];

        if (isFamily) {
          const { data: familyStudents } = await supabase
            .from('students')
            .select(`
              session_students(session_id)
            `)
            .eq('family_group_id', item.id);

          if (familyStudents) {
            sessionIds = familyStudents
              .flatMap(student => student.session_students || [])
              .map(ss => ss.session_id);
          }
        } else {
          const { data: sessionStudents } = await supabase
            .from('session_students')
            .select('session_id')
            .eq('student_id', item.id);

          if (sessionStudents) {
            sessionIds = sessionStudents.map(ss => ss.session_id);
          }
        }

        if (sessionIds.length > 0) {
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
  }, [item.id, isFamily]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-orange-100 text-orange-800', label: 'Pending' },
      'confirmed': { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      'trial-completed': { color: 'bg-green-100 text-green-800', label: 'Trial Completed' },
      'trial-ghosted': { color: 'bg-red-100 text-red-800', label: 'Trial Ghosted' },
      'paid': { color: 'bg-purple-100 text-purple-800', label: 'Paid' },
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

    if (data.status === 'pending') {
      options.push(
        { label: `Contact ${isFamily ? 'Family' : 'Student'}`, action: () => onContact(data.phone, isFamily ? (data as TeacherTrialFamily).parentName : (data as TeacherTrialStudent).name), icon: MessageCircle },
        { label: 'Confirm Trial', action: () => onConfirm(item), icon: CheckCircle },
        { 
          label: 'Reschedule', 
          action: () => {
            console.log(`🔄 CRITICAL FIX: ${isFamily ? 'Family' : 'Individual'} reschedule enabled`);
            onReschedule(item);
          }, 
          icon: RotateCcw 
        }
      );
    } else if (data.status === 'confirmed') {
      const canMarkOutcome = !!data.sessionId || isFamily;
      
      if (canMarkOutcome) {
        options.push(
          { label: 'Mark as Completed', action: () => onMarkCompleted(item), icon: CheckCircle },
          { label: 'Mark as Ghosted', action: () => onMarkGhosted(item), icon: XCircle }
        );
      } else {
        console.warn('⚠️ Cannot mark outcome - no session ID for individual student:', (data as TeacherTrialStudent).name);
      }
      
      options.push(
        { 
          label: 'Reschedule', 
          action: () => {
            console.log(`🔄 CRITICAL FIX: ${isFamily ? 'Family' : 'Individual'} reschedule enabled`);
            onReschedule(item);
          }, 
          icon: RotateCcw 
        },
        { label: `Contact ${isFamily ? 'Family' : 'Student'}`, action: () => onContact(data.phone, isFamily ? (data as TeacherTrialFamily).parentName : (data as TeacherTrialStudent).name), icon: MessageCircle }
      );
    } else if (data.status === 'paid' && onCompleteRegistration) {
      // Phase 3: Only paid students get "Complete Registration" button
      options.push(
        { label: 'Complete Registration', action: () => onCompleteRegistration(item), icon: Users }
      );
      options.push(
        { label: `Contact ${isFamily ? 'Family' : 'Student'}`, action: () => onContact(data.phone, isFamily ? (data as TeacherTrialFamily).parentName : (data as TeacherTrialStudent).name), icon: MessageCircle }
      );
    } else {
      options.push(
        { label: `Contact ${isFamily ? 'Family' : 'Student'}`, action: () => onContact(data.phone, isFamily ? (data as TeacherTrialFamily).parentName : (data as TeacherTrialStudent).name), icon: MessageCircle }
      );
    }

    return options;
  };

  const getName = () => {
    if (isFamily) {
      return (data as TeacherTrialFamily).parentName;
    }
    return (data as TeacherTrialStudent).name;
  };

  const getDisplayInfo = () => {
    if (isFamily) {
      const familyData = data as TeacherTrialFamily;
      return {
        uniqueId: familyData.uniqueId,
        ageInfo: `${familyData.studentCount} students`,
        parentInfo: null
      };
    } else {
      const studentData = data as TeacherTrialStudent;
      return {
        uniqueId: studentData.uniqueId,
        ageInfo: `Age: ${studentData.age}`,
        parentInfo: studentData.parentName ? `Parent: ${studentData.parentName}` : null
      };
    }
  };

  const displayInfo = getDisplayInfo();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                {isFamily ? (
                  <Users className="h-4 w-4 text-primary" />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
                <h3 className="font-semibold text-lg">{getName()}</h3>
              </div>
              {getStatusBadge(data.status)}
              <Badge variant="outline" className="text-xs">
                {isFamily ? 'Family' : 'Individual'}
              </Badge>
              {rescheduleInfo && rescheduleInfo.rescheduleCount > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 border-0">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Rescheduled ({rescheduleInfo.rescheduleCount}x)
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{displayInfo.uniqueId}</span>
              <span>{displayInfo.ageInfo}</span>
              {displayInfo.parentInfo && (
                <span>{displayInfo.parentInfo}</span>
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
            <span>{data.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{data.country}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">
                {formatDateTime(data.trialDate, data.trialTime)}
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
        {data.notes && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Notes:</strong> {data.notes}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        {data.status === 'pending' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onContact(data.phone, getName())}
            >
              Contact
            </Button>
            <Button 
              size="sm"
              className="ayat-button-primary"
              onClick={() => onConfirm(item)}
            >
              Confirm
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
