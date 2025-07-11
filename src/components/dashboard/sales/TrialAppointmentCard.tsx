import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Phone, 
  Users as UsersIcon, 
  Calendar, 
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MixedStudentItem } from '@/hooks/useMixedStudentData';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudent } from '@/types/trial';
import { format } from 'date-fns';

interface TrialAppointmentCardProps {
  item: MixedStudentItem;
  onContact: (item: MixedStudentItem) => void;
  onScheduleFollowUp?: (item: MixedStudentItem) => void;
  onCreatePaymentLink?: (item: MixedStudentItem) => void;
}

export const TrialAppointmentCard: React.FC<TrialAppointmentCardProps> = ({
  item,
  onContact,
  onScheduleFollowUp,
  onCreatePaymentLink
}) => {
  const [notesExpanded, setNotesExpanded] = useState(false);
  
  const isFamily = item.type === 'family';
  const data = item.data;
  
  // Helper functions
  const getName = () => isFamily ? (data as FamilyGroup).parent_name : (data as TrialSessionFlowStudent).name;
  const getAge = () => !isFamily ? (data as TrialSessionFlowStudent).age : null;
  const getUniqueId = () => isFamily ? (data as FamilyGroup).unique_id : (data as TrialSessionFlowStudent).uniqueId;
  const getStatus = () => data.status;
  const getPhone = () => data.phone;
  const getTrialDate = () => isFamily ? (data as FamilyGroup).trial_date : (data as TrialSessionFlowStudent).trialDate;
  const getTrialTime = () => isFamily ? (data as FamilyGroup).trial_time : (data as TrialSessionFlowStudent).trialTime;
  const getTeacherType = () => isFamily ? (data as FamilyGroup).teacher_type : (data as TrialSessionFlowStudent).teacherType;
  const getNotes = () => data.notes;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-status-warning-background text-status-warning-text border-status-warning-border', label: 'Pending' },
      'confirmed': { color: 'bg-status-info-background text-status-info-text border-status-info-border', label: 'Confirmed' },
      'trial-completed': { color: 'bg-status-success-background text-status-success-text border-status-success-border', label: 'Trial Completed' },
      'trial-ghosted': { color: 'bg-status-danger-background text-status-danger-text border-status-danger-border', label: 'Trial Ghosted' },
      'follow-up': { color: 'bg-status-warning-background text-status-warning-text border-status-warning-border', label: 'Follow-up' },
      'awaiting-payment': { color: 'bg-status-pending-background text-status-pending-text', label: 'Awaiting Payment' },
      'paid': { color: 'bg-status-success-background text-status-success-text border-status-success-border', label: 'Paid' },
      'active': { color: 'bg-status-info-background text-status-info-text border-status-info-border', label: 'Active' },
      'expired': { color: 'bg-neutral-gray200 text-neutral-gray700', label: 'Expired' },
      'cancelled': { color: 'bg-neutral-gray200 text-neutral-gray700', label: 'Cancelled' },
      'dropped': { color: 'bg-neutral-gray200 text-neutral-gray700', label: 'Dropped' }
    };

    const config = statusConfig[status] || { color: 'bg-neutral-gray200 text-neutral-gray700', label: status };
    return (
      <Badge className={`${config.color} border text-xs px-3 py-1`}>
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

  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header with Avatar, Name, ID, Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar Placeholder */}
          <div className="w-12 h-12 rounded-full bg-neutral-gray200 flex items-center justify-center">
            {isFamily ? (
              <UsersIcon className="h-6 w-6 text-neutral-gray500" />
            ) : (
              <User className="h-6 w-6 text-neutral-gray500" />
            )}
          </div>
          
          {/* Name, Age, ID */}
          <div>
            <div className="font-medium text-text-primary text-base">
              {getName()}{getAge() && ` (${getAge()})`}
            </div>
            <div className="text-xs text-text-secondary font-mono">
              {getUniqueId()}
            </div>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="flex-shrink-0">
          {getStatusBadge(getStatus())}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-neutral-gray500" />
          <span className="text-sm text-text-secondary">{getPhone()}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-neutral-gray500" />
          <span className="text-sm text-text-secondary">{getTeacherType()}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-neutral-gray500" />
          <span className="text-sm text-text-secondary">Zoom</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-neutral-gray500" />
          <span className="text-sm text-text-secondary">
            {formatDateTime(getTrialDate(), getTrialTime())}
          </span>
        </div>
      </div>

      {/* Notes Section */}
      {getNotes() && (
        <div className="mb-4">
          <button
            onClick={() => setNotesExpanded(!notesExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-text-primary hover:text-primary transition-colors w-full text-left"
          >
            <span>Notes</span>
            {notesExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {notesExpanded && (
            <div className="mt-2 p-3 bg-backgrounds-tertiary rounded-lg border border-border">
              <p className="text-sm text-text-secondary">{getNotes()}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => onScheduleFollowUp?.(item)}
          className="flex-1 h-9 text-sm border-border text-text-primary hover:bg-backgrounds-tertiary"
        >
          Schedule Follow-up
        </Button>
        
        <Button 
          size="sm"
          onClick={() => onCreatePaymentLink?.(item)}
          className="flex-1 h-9 text-sm bg-primary text-white hover:bg-primary-dark"
        >
          Create Payment Link
        </Button>
      </div>
    </div>
  );
};