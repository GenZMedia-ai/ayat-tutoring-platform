
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Phone, 
  Calendar, 
  User, 
  Video,
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
}

export const TrialAppointmentCard: React.FC<TrialAppointmentCardProps> = ({
  item,
  onContact,
  onCreatePaymentLink,
  onScheduleFollowUp
}) => {
  const [notesExpanded, setNotesExpanded] = useState(false);
  
  const isFamily = item.type === 'family';
  const data = item.data;
  
  // Helper functions
  const getName = () => isFamily ? (data as FamilyGroup).parent_name : (data as TrialSessionFlowStudent).name;
  const getUniqueId = () => isFamily ? (data as FamilyGroup).unique_id : (data as TrialSessionFlowStudent).uniqueId;
  const getAge = () => !isFamily ? (data as TrialSessionFlowStudent).age : null;
  const getPhone = () => data.phone;
  const getTeacherType = () => isFamily ? (data as FamilyGroup).teacher_type : (data as TrialSessionFlowStudent).teacherType;
  const getTrialDate = () => isFamily ? (data as FamilyGroup).trial_date : (data as TrialSessionFlowStudent).trialDate;
  const getTrialTime = () => isFamily ? (data as FamilyGroup).trial_time : (data as TrialSessionFlowStudent).trialTime;
  const getNotes = () => data.notes;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Pending' },
      'confirmed': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Confirmed' },
      'trial-completed': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Trial Completed' },
      'trial-ghosted': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Trial Ghosted' },
      'follow-up': { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Follow-up' },
      'awaiting-payment': { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Awaiting Payment' },
      'paid': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Paid' },
      'active': { color: 'bg-cyan-100 text-cyan-800 border-cyan-200', label: 'Active' },
      'expired': { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Expired' },
      'cancelled': { color: 'bg-slate-100 text-slate-800 border-slate-200', label: 'Cancelled' },
      'dropped': { color: 'bg-slate-100 text-slate-800 border-slate-200', label: 'Dropped' }
    };

    const config = statusConfig[data.status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: data.status };
    return (
      <Badge className={`${config.color} border text-xs px-2 py-1`}>
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 bg-gray-100">
              <AvatarFallback className="text-gray-600 font-medium">
                {getInitials(getName())}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{getName()}</h3>
                {getAge() && (
                  <span className="text-gray-500 text-sm">• Age {getAge()}</span>
                )}
                <span className="text-gray-400 text-sm font-mono">#{getUniqueId()}</span>
              </div>
            </div>
          </div>
          {getStatusBadge(data.status)}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">{getPhone()}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700 capitalize">{getTeacherType()} Teacher</span>
          </div>
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">Zoom link</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">{formatDateTime(getTrialDate(), getTrialTime())}</span>
          </div>
        </div>

        {/* Notes Section */}
        {getNotes() && (
          <div className="mb-4 border-t border-gray-100 pt-4">
            <button
              onClick={() => setNotesExpanded(!notesExpanded)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span>Notes</span>
              {notesExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {notesExpanded && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{getNotes()}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          {onScheduleFollowUp && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onScheduleFollowUp(item)}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Schedule Follow-up
            </Button>
          )}
          {onCreatePaymentLink && (
            <Button
              size="sm"
              onClick={() => onCreatePaymentLink(item)}
              className="flex-1 bg-amber-800 hover:bg-amber-900 text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Create Payment Link
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
