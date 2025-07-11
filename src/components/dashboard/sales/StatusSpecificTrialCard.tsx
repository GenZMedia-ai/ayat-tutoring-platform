
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Phone, 
  MapPin, 
  User, 
  MessageCircle,
  CreditCard,
  Users,
  Repeat,
  FileX,
  AlertTriangle,
  UserX,
  GraduationCap,
  FileText,
  Star,
  Target,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MixedStudentItem } from '@/hooks/useMixedStudentData';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudentPartial } from '@/types/trial';
import { format } from 'date-fns';

interface StatusSpecificTrialCardProps {
  item: MixedStudentItem;
  onEditInfo: (item: MixedStudentItem) => void;
  onContact: (item: MixedStudentItem) => void;
  onCreatePaymentLink?: (item: MixedStudentItem) => void;
  onScheduleFollowUp?: (item: MixedStudentItem) => void;
  onCompleteFollowUp?: (item: MixedStudentItem) => void;
  onRescheduleFollowUp?: (item: MixedStudentItem) => void;
  onMarkAsDropped?: (item: MixedStudentItem) => void;
  onRescheduleAppointment?: (item: MixedStudentItem) => void;
  onRecreatePaymentLink?: (item: MixedStudentItem) => void;
  onMarkAsCanceled?: (item: MixedStudentItem) => void;
}

export const StatusSpecificTrialCard: React.FC<StatusSpecificTrialCardProps> = ({
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
  const isFamily = item.type === 'family';
  const data = item.data;
  
  // Helper functions
  const getName = () => isFamily ? (data as FamilyGroup).parent_name : (data as TrialSessionFlowStudentPartial).name;
  const getUniqueId = () => isFamily ? (data as FamilyGroup).unique_id : (data as TrialSessionFlowStudentPartial).uniqueId;
  const getStatus = () => data.status;
  const getPhone = () => data.phone;
  const getCountry = () => data.country;
  const getPlatform = () => data.platform;
  const getNotes = () => data.notes;
  const getTrialDate = () => isFamily ? (data as FamilyGroup).trial_date : (data as TrialSessionFlowStudentPartial).trialDate;
  const getTrialTime = () => isFamily ? (data as FamilyGroup).trial_time : (data as TrialSessionFlowStudentPartial).trialTime;
  const getTeacherType = () => isFamily ? (data as FamilyGroup).teacher_type : (data as TrialSessionFlowStudentPartial).teacherType;
  const getStudentCount = () => isFamily ? (data as FamilyGroup).student_count : 1;
  const getAge = () => !isFamily ? (data as TrialSessionFlowStudentPartial).age : null;
  const getParentName = () => !isFamily ? (data as TrialSessionFlowStudentPartial).parentName : null;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Pending' },
      'confirmed': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Confirmed' },
      'trial-completed': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
      'trial-ghosted': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Ghosted' },
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
      <Badge className={`${config.color} border text-xs px-2 py-1`}>
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderActionButtons = () => {
    const status = getStatus();
    
    switch (status) {
      case 'trial-completed':
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => onScheduleFollowUp?.(item)}
              variant="outline"
              size="sm"
              className="sales-btn-ghost flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Follow-up
            </Button>
            <Button
              onClick={() => onCreatePaymentLink?.(item)}
              size="sm"
              className="sales-btn-primary flex-1"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Create Payment Link
            </Button>
          </div>
        );
        
      case 'awaiting-payment':
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => onContact(item)}
              variant="outline"
              size="sm"
              className="sales-btn-ghost flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact
            </Button>
            <Button
              onClick={() => onRecreatePaymentLink?.(item)}
              size="sm"
              className="sales-btn-primary flex-1"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Recreate Payment Link
            </Button>
          </div>
        );
        
      case 'follow-up':
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => onCompleteFollowUp?.(item)}
              variant="outline"
              size="sm"
              className="sales-btn-ghost flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Follow-up
            </Button>
            <Button
              onClick={() => onCreatePaymentLink?.(item)}
              size="sm"
              className="sales-btn-primary flex-1"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Create Payment Link
            </Button>
          </div>
        );
        
      default:
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => onEditInfo(item)}
              variant="outline"
              size="sm"
              className="sales-btn-ghost flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Edit Info
            </Button>
            <Button
              onClick={() => onContact(item)}
              size="sm"
              className="sales-btn-primary flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact
            </Button>
          </div>
        );
    }
  };

  return (
    <Card className="bg-sales-bg-secondary border-sales-border shadow-sales-sm hover:shadow-sales-md transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-sales-primary/10 border-2 border-sales-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sales-primary font-medium text-sm">
              {getInitials(getName())}
            </span>
          </div>
          
          {/* Name and Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sales-text-primary text-lg truncate">
                  {getName()}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {!isFamily && getAge() && (
                    <span className="text-sm text-sales-text-secondary">Age {getAge()}</span>
                  )}
                  <span className="text-xs text-sales-text-muted font-mono">
                    {getUniqueId()}
                  </span>
                </div>
              </div>
              {getStatusBadge(getStatus())}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-sales-text-muted flex-shrink-0" />
            <span className="text-sales-text-secondary truncate">{getPhone()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4 text-sales-text-muted flex-shrink-0" />
            <span className="text-sales-text-secondary capitalize truncate">{getTeacherType()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-sales-text-muted flex-shrink-0" />
            <span className="text-sales-text-secondary truncate">{getCountry()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-sales-text-muted flex-shrink-0" />
            <span className="text-sales-text-secondary truncate">
              {formatDateTime(getTrialDate(), getTrialTime())}
            </span>
          </div>
        </div>

        {/* Expandable Notes Section */}
        {getNotes() && (
          <div className="border-t border-sales-border pt-4">
            <button
              onClick={() => setNotesExpanded(!notesExpanded)}
              className="flex items-center justify-between w-full text-left text-sm font-medium text-sales-text-primary hover:text-sales-text-secondary transition-colors"
            >
              <span>Notes</span>
              {notesExpanded ? (
                <ChevronUp className="h-4 w-4 text-sales-text-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 text-sales-text-muted" />
              )}
            </button>
            {notesExpanded && (
              <div className="mt-3 p-3 bg-sales-bg-tertiary rounded-lg border border-sales-border">
                <p className="text-sm text-sales-text-secondary leading-relaxed">
                  {getNotes()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-sales-border">
          {renderActionButtons()}
        </div>
      </CardContent>
    </Card>
  );
};
