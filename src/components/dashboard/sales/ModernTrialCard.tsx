
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Phone, 
  User, 
  Video, 
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageCircle,
  Edit3
} from 'lucide-react';
import { MixedStudentItem } from '@/hooks/useMixedStudentData';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudent } from '@/types/trial';
import { format } from 'date-fns';

interface ModernTrialCardProps {
  item: MixedStudentItem;
  onEditInfo: (item: MixedStudentItem) => void;
  onContact: (item: MixedStudentItem) => void;
  onCreatePaymentLink: (item: MixedStudentItem) => void;
  onScheduleFollowUp: (item: MixedStudentItem) => void;
  onCompleteFollowUp: (item: MixedStudentItem) => void;
  onRescheduleFollowUp: (item: MixedStudentItem) => void;
  onMarkAsDropped: (item: MixedStudentItem) => void;
  onRescheduleAppointment: (item: MixedStudentItem) => void;
  onRecreatePaymentLink: (item: MixedStudentItem) => void;
  onMarkAsCanceled: (item: MixedStudentItem) => void;
}

export const ModernTrialCard: React.FC<ModernTrialCardProps> = ({
  item,
  onEditInfo,
  onContact,
  onCreatePaymentLink,
  onScheduleFollowUp,
  onCompleteFollowUp,
  onRescheduleFollowUp,
  onMarkAsDropped,
  onRescheduleAppointment,
  onRecreatePaymentLink,
  onMarkAsCanceled
}) => {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const data = item.data;
  const name = item.type === 'family' 
    ? (data as FamilyGroup).parent_name 
    : (data as TrialSessionFlowStudent).name;
  const uniqueId = item.type === 'family'
    ? (data as FamilyGroup).unique_id
    : (data as TrialSessionFlowStudent).uniqueId;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string }> = {
      'pending': { className: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Pending' },
      'confirmed': { className: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Confirmed' },
      'trial-completed': { className: 'bg-green-100 text-green-800 border-green-200', label: 'Trial Completed' },
      'trial-ghosted': { className: 'bg-red-100 text-red-800 border-red-200', label: 'Trial Ghosted' },
      'awaiting-payment': { className: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Awaiting Payment' },
      'paid': { className: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Paid' },
      'active': { className: 'bg-cyan-100 text-cyan-800 border-cyan-200', label: 'Active' },
      'expired': { className: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Expired' },
      'cancelled': { className: 'bg-slate-100 text-slate-800 border-slate-200', label: 'Cancelled' },
      'dropped': { className: 'bg-slate-100 text-slate-800 border-slate-200', label: 'Dropped' }
    };

    const config = statusConfig[status] || { className: 'bg-gray-100 text-gray-800 border-gray-200', label: status };
    return (
      <Badge className={`${config.className} border text-xs font-medium px-2 py-1 rounded-full`}>
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (date?: string, time?: string) => {
    if (!date || !time) return 'Not scheduled';
    try {
      const dateTime = new Date(`${date}T${time}`);
      return format(dateTime, 'MMM dd, yyyy • HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const getTrialDate = () => {
    return item.type === 'family' 
      ? (data as FamilyGroup).trial_date 
      : (data as TrialSessionFlowStudent).trialDate;
  };

  const getTrialTime = () => {
    return item.type === 'family' 
      ? (data as FamilyGroup).trial_time 
      : (data as TrialSessionFlowStudent).trialTime;
  };

  const getTeacherType = () => {
    return item.type === 'family' 
      ? (data as FamilyGroup).teacher_type 
      : (data as TrialSessionFlowStudent).teacherType;
  };

  const getAge = () => {
    if (item.type === 'family') {
      const familyData = data as FamilyGroup;
      return `${familyData.student_count} students`;
    } else {
      const studentData = data as TrialSessionFlowStudent;
      return `${studentData.age} years old`;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderActionButtons = () => {
    switch (data.status) {
      case 'pending':
        return (
          <>
            <Button 
              className="flex-1 bg-stone-700 hover:bg-stone-800 text-white"
              onClick={() => onContact(item)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-stone-300 hover:bg-stone-50"
              onClick={() => onEditInfo(item)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </>
        );

      case 'confirmed':
        return (
          <>
            <Button 
              className="flex-1 bg-stone-700 hover:bg-stone-800 text-white"
              onClick={() => onContact(item)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Remind
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-stone-300 hover:bg-stone-50"
              onClick={() => onRescheduleAppointment(item)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Reschedule
            </Button>
          </>
        );

      case 'trial-completed':
        return (
          <>
            <Button 
              className="flex-1 bg-stone-700 hover:bg-stone-800 text-white"
              onClick={() => onCreatePaymentLink(item)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Payment Link
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-stone-300 hover:bg-stone-50"
              onClick={() => onScheduleFollowUp(item)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Follow-up
            </Button>
          </>
        );

      case 'awaiting-payment':
        return (
          <>
            <Button 
              className="flex-1 bg-stone-700 hover:bg-stone-800 text-white"
              onClick={() => onContact(item)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Reminder
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-stone-300 hover:bg-stone-50"
              onClick={() => onRecreatePaymentLink(item)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Link
            </Button>
          </>
        );

      default:
        return (
          <>
            <Button 
              className="flex-1 bg-stone-700 hover:bg-stone-800 text-white"
              onClick={() => onContact(item)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-stone-300 hover:bg-stone-50"
              onClick={() => onEditInfo(item)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </>
        );
    }
  };

  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        {/* Header with Avatar, Name, and Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src="" alt={name} />
              <AvatarFallback className="bg-stone-100 text-stone-700 font-medium text-sm">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">{name}</h3>
              <p className="text-sm text-gray-500">{getAge()}</p>
              <p className="text-xs text-gray-400 font-mono">{uniqueId}</p>
            </div>
          </div>
          {getStatusBadge(data.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Information Rows */}
        <div className="space-y-3">
          {/* Phone */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-stone-100 rounded-full">
              <Phone className="h-4 w-4 text-stone-600" />
            </div>
            <span className="text-sm text-gray-700">{data.phone}</span>
          </div>

          {/* Teacher */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-stone-100 rounded-full">
              <User className="h-4 w-4 text-stone-600" />
            </div>
            <span className="text-sm text-gray-700 capitalize">{getTeacherType()} Teacher</span>
          </div>

          {/* Meeting */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-stone-100 rounded-full">
              <Video className="h-4 w-4 text-stone-600" />
            </div>
            <span className="text-sm text-gray-700 capitalize">
              {item.type === 'family' 
                ? (data as FamilyGroup).platform 
                : (data as TrialSessionFlowStudent).platform} Meeting
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-stone-100 rounded-full">
              <Calendar className="h-4 w-4 text-stone-600" />
            </div>
            <span className="text-sm text-gray-700">
              {formatDateTime(getTrialDate(), getTrialTime())}
            </span>
          </div>
        </div>

        {/* Notes Section */}
        {data.notes && (
          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={() => setNotesExpanded(!notesExpanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-stone-600" />
                <span className="text-sm font-medium text-gray-700">Notes</span>
              </div>
              {notesExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            
            {notesExpanded && (
              <div className="mt-3 pl-6">
                <p className="text-sm text-gray-600 leading-relaxed">{data.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-100">
          {renderActionButtons()}
        </div>
      </CardContent>
    </Card>
  );
};
