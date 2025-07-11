
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Phone, 
  User, 
  Calendar, 
  Clock,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  CreditCard
} from 'lucide-react';
import { MixedStudentItem } from '@/hooks/useMixedStudentData';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudent } from '@/types/trial';
import { format } from 'date-fns';

interface TrialAppointmentCardProps {
  item: MixedStudentItem;
  onContact: (item: MixedStudentItem) => void;
  onCreatePaymentLink?: (item: MixedStudentItem) => void;
  onScheduleFollowUp?: (item: MixedStudentItem) => void;
  onCompleteFollowUp?: (item: MixedStudentItem) => void;
  onEditInfo: (item: MixedStudentItem) => void;
  onRescheduleFollowUp?: (item: MixedStudentItem) => void;
  onMarkAsDropped?: (item: MixedStudentItem) => void;
  onRescheduleAppointment?: (item: MixedStudentItem) => void;
  onRecreatePaymentLink?: (item: MixedStudentItem) => void;
  onMarkAsCanceled?: (item: MixedStudentItem) => void;
}

export const TrialAppointmentCard: React.FC<TrialAppointmentCardProps> = ({
  item,
  onContact,
  onCreatePaymentLink,
  onScheduleFollowUp,
  onCompleteFollowUp,
  onEditInfo,
  onRescheduleFollowUp,
  onMarkAsDropped,
  onRescheduleAppointment,
  onRecreatePaymentLink,
  onMarkAsCanceled
}) => {
  const [notesExpanded, setNotesExpanded] = useState(false);
  
  const isFamily = item.type === 'family';
  const data = item.data;
  
  const getName = () => isFamily ? (data as FamilyGroup).parent_name : (data as TrialSessionFlowStudent).name;
  const getAge = () => !isFamily ? (data as TrialSessionFlowStudent).age : null;
  const getUniqueId = () => isFamily ? (data as FamilyGroup).unique_id : (data as TrialSessionFlowStudent).uniqueId;
  const getPhone = () => data.phone;
  const getTeacherType = () => data.teacher_type;
  const getTrialDate = () => isFamily ? (data as FamilyGroup).trial_date : (data as TrialSessionFlowStudent).trialDate;
  const getTrialTime = () => isFamily ? (data as FamilyGroup).trial_time : (data as TrialSessionFlowStudent).trialTime;
  const getNotes = () => data.notes;
  const getStatus = () => data.status;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Pending' },
      'confirmed': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Confirmed' },
      'trial-completed': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Trial Completed' },
      'trial-ghosted': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Trial Ghosted' },
      'follow-up': { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Follow-up' },
      'awaiting-payment': { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Awaiting Payment' },
      'paid': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Paid' },
      'active': { color: 'bg-cyan-100 text-cyan-800 border-cyan-200', label: 'Active' },
      'expired': { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Expired' },
      'cancelled': { color: 'bg-slate-100 text-slate-800 border-slate-200', label: 'Cancelled' },
      'dropped': { color: 'bg-slate-100 text-slate-800 border-slate-200', label: 'Dropped' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status };
    return (
      <Badge className={`${config.color} border text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (date?: string, time?: string) => {
    if (!date || !time) return 'Not scheduled';
    try {
      const dateTime = new Date(`${date}T${time}`);
      return format(dateTime, 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (date?: string, time?: string) => {
    if (!date || !time) return 'Not scheduled';
    try {
      const dateTime = new Date(`${date}T${time}`);
      return format(dateTime, 'HH:mm');
    } catch {
      return 'Invalid time';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="border border-stone-200 bg-white">
      <CardContent className="p-5">
        {/* Header with Avatar, Name, and Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-stone-100 text-stone-600 text-sm font-medium">
                {getInitials(getName())}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-800">
                {getName()}
              </span>
              {getAge() && (
                <span className="text-stone-500 text-sm">
                  • Age {getAge()}
                </span>
              )}
              <span className="text-stone-400 text-sm font-mono">
                • {getUniqueId()}
              </span>
            </div>
          </div>
          {getStatusBadge(getStatus())}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Phone className="h-4 w-4 text-stone-400" />
            <span>{getPhone()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <User className="h-4 w-4 text-stone-400" />
            <span className="capitalize">{getTeacherType()} Teacher</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Calendar className="h-4 w-4 text-stone-400" />
            <span>{formatDateTime(getTrialDate(), getTrialTime())}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Clock className="h-4 w-4 text-stone-400" />
            <span>{formatTime(getTrialDate(), getTrialTime())}</span>
          </div>
        </div>

        {/* Notes Section */}
        {getNotes() && (
          <div className="mb-4">
            <button
              onClick={() => setNotesExpanded(!notesExpanded)}
              className="flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-900 mb-2"
            >
              <span>Booking Notes</span>
              {notesExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {notesExpanded && (
              <div className="bg-stone-50 border border-stone-200 rounded-md p-3 text-sm text-stone-600">
                {getNotes()}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3 border-t border-stone-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onScheduleFollowUp?.(item)}
            className="flex-1 border-stone-300 text-stone-700 hover:bg-stone-50"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Schedule Follow-up
          </Button>
          <Button
            size="sm"
            onClick={() => onCreatePaymentLink?.(item)}
            className="flex-1 bg-stone-800 hover:bg-stone-900 text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Create Payment Link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
