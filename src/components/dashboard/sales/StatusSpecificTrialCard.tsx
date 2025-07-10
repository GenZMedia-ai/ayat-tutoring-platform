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
  CheckCircle2
} from 'lucide-react';
import { MixedStudentItem } from '@/hooks/useMixedStudentData';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudent } from '@/types/trial';
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
  const isFamily = item.type === 'family';
  const data = item.data;
  
  // Helper functions
  const getName = () => isFamily ? (data as FamilyGroup).parent_name : (data as TrialSessionFlowStudent).name;
  const getUniqueId = () => isFamily ? (data as FamilyGroup).unique_id : (data as TrialSessionFlowStudent).uniqueId;
  const getStatus = () => data.status;
  const getPhone = () => data.phone;
  const getCountry = () => data.country;
  const getPlatform = () => data.platform;
  const getNotes = () => data.notes;
  const getTrialDate = () => isFamily ? (data as FamilyGroup).trial_date : (data as TrialSessionFlowStudent).trialDate;
  const getTrialTime = () => isFamily ? (data as FamilyGroup).trial_time : (data as TrialSessionFlowStudent).trialTime;
  const getTeacherType = () => isFamily ? (data as FamilyGroup).teacher_type : (data as TrialSessionFlowStudent).teacherType;
  const getStudentCount = () => isFamily ? (data as FamilyGroup).student_count : 1;
  const getAge = () => !isFamily ? (data as TrialSessionFlowStudent).age : null;
  const getParentName = () => !isFamily ? (data as TrialSessionFlowStudent).parentName : null;
  const getTrialOutcome = () => !isFamily ? (data as TrialSessionFlowStudent).trialOutcome : null;

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

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status };
    return (
      <Badge className={`${config.color} border`}>
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

  const renderTrialOutcomeSection = () => {
    const trialOutcome = getTrialOutcome();
    if (!trialOutcome) return null;

    const outcomeConfig = {
      'completed': { 
        bg: 'bg-green-50 border-green-200', 
        icon: CheckCircle2, 
        iconColor: 'text-green-600',
        title: 'Trial Completed Successfully'
      },
      'ghosted': { 
        bg: 'bg-red-50 border-red-200', 
        icon: AlertTriangle, 
        iconColor: 'text-red-600',
        title: 'Trial Session Missed'
      },
      'rescheduled': { 
        bg: 'bg-amber-50 border-amber-200', 
        icon: Clock, 
        iconColor: 'text-amber-600',
        title: 'Trial Rescheduled'
      }
    };

    const config = outcomeConfig[trialOutcome.outcome as keyof typeof outcomeConfig] || outcomeConfig.completed;
    const IconComponent = config.icon;

    return (
      <div className={`p-3 rounded-lg border ${config.bg} space-y-2`}>
        <div className="flex items-center gap-2 mb-2">
          <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
          <span className="text-sm font-semibold text-gray-800">{config.title}</span>
          {trialOutcome.submittedAt && (
            <span className="text-xs text-gray-500">
              {format(new Date(trialOutcome.submittedAt), 'MMM dd, HH:mm')}
            </span>
          )}
        </div>
        
        {trialOutcome.teacherNotes && (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Teacher Notes</span>
            </div>
            <p className="text-sm text-gray-800 bg-white/50 p-2 rounded border">
              {trialOutcome.teacherNotes}
            </p>
          </div>
        )}
        
        {trialOutcome.studentBehavior && (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Student Behavior</span>
            </div>
            <p className="text-sm text-gray-800 bg-white/50 p-2 rounded border">
              {trialOutcome.studentBehavior}
            </p>
          </div>
        )}
        
        {trialOutcome.recommendedPackage && (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Recommended Package</span>
            </div>
            <p className="text-sm text-gray-800 bg-white/50 p-2 rounded border">
              {trialOutcome.recommendedPackage}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderStatusSpecificActions = () => {
    const status = getStatus();
    const commonContactButton = (
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => onContact(item)}
        className="border-primary/30 text-primary hover:bg-primary/5"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Contact {isFamily ? 'Family' : 'Student'}
      </Button>
    );

    const editInfoButton = (
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => onEditInfo(item)}
        className="border-primary/30 text-primary hover:bg-primary/5"
      >
        <FileX className="h-4 w-4 mr-2" />
        Edit Info
      </Button>
    );

    switch (status) {
      case 'pending':
        return (
          <div className="flex flex-wrap gap-2">
            {editInfoButton}
            {commonContactButton}
          </div>
        );

      case 'confirmed':
        return (
          <div className="flex flex-wrap gap-2">
            {commonContactButton}
          </div>
        );

      case 'trial-completed':
        return (
          <div className="flex flex-wrap gap-2">
            {editInfoButton}
            {commonContactButton}
            {onMarkAsDropped && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onMarkAsDropped(item)}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <UserX className="h-4 w-4 mr-2" />
                Mark as Dropped
              </Button>
            )}
            {onScheduleFollowUp && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onScheduleFollowUp(item)}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Follow-up
              </Button>
            )}
            {onCreatePaymentLink && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onCreatePaymentLink(item)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Create Payment Link
              </Button>
            )}
          </div>
        );

      case 'trial-ghosted':
        return (
          <div className="flex flex-wrap gap-2">
            {editInfoButton}
            {commonContactButton}
            {onRescheduleAppointment && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onRescheduleAppointment(item)}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Repeat className="h-4 w-4 mr-2" />
                Reschedule Appointment
              </Button>
            )}
            {onMarkAsDropped && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onMarkAsDropped(item)}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <UserX className="h-4 w-4 mr-2" />
                Mark as Dropped
              </Button>
            )}
          </div>
        );

      case 'follow-up':
        return (
          <div className="flex flex-wrap gap-2">
            {editInfoButton}
            {commonContactButton}
            {onCreatePaymentLink && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onCreatePaymentLink(item)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Create Payment Link
              </Button>
            )}
            {onRescheduleFollowUp && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onRescheduleFollowUp(item)}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Reschedule Follow-up
              </Button>
            )}
          </div>
        );

      case 'awaiting-payment':
        return (
          <div className="flex flex-wrap gap-2">
            {editInfoButton}
            {commonContactButton}
            {onMarkAsDropped && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onMarkAsDropped(item)}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <UserX className="h-4 w-4 mr-2" />
                Mark as Dropped
              </Button>
            )}
            {onRecreatePaymentLink && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onRecreatePaymentLink(item)}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Recreate Payment Link
              </Button>
            )}
          </div>
        );

      case 'paid':
      case 'active':
        return (
          <div className="flex flex-wrap gap-2">
            {commonContactButton}
            <div className="text-sm text-green-600 font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Session in progress - no actions until expiry
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="flex flex-wrap gap-2">
            {editInfoButton}
            {commonContactButton}
            {onCreatePaymentLink && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onCreatePaymentLink(item)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Create Payment Link
              </Button>
            )}
            {onScheduleFollowUp && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onScheduleFollowUp(item)}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Follow-up
              </Button>
            )}
            {onMarkAsCanceled && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onMarkAsCanceled(item)}
                className="border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <FileX className="h-4 w-4 mr-2" />
                Mark as Canceled
              </Button>
            )}
          </div>
        );

      case 'cancelled':
        return (
          <div className="flex flex-wrap gap-2">
            {editInfoButton}
            {commonContactButton}
            {onCreatePaymentLink && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onCreatePaymentLink(item)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Create Payment Link
              </Button>
            )}
            {onScheduleFollowUp && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onScheduleFollowUp(item)}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Follow-up
              </Button>
            )}
          </div>
        );

      default:
        return (
          <div className="flex flex-wrap gap-2">
            {editInfoButton}
            {commonContactButton}
          </div>
        );
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                {isFamily ? (
                  <Users className="h-4 w-4 text-primary" />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
                <h3 className="font-semibold text-lg">{getName()}</h3>
              </div>
              {getStatusBadge(getStatus())}
              <Badge variant="outline" className="text-xs border-primary/30">
                {isFamily ? 'Family' : 'Individual'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono text-primary/70">{getUniqueId()}</span>
              {isFamily ? (
                <span className="text-primary/60">{getStudentCount()} students</span>
              ) : (
                <>
                  <span>Age: {getAge()}</span>
                  {getParentName() && (
                    <span>Parent: {getParentName()}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{getPhone()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{getCountry()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDateTime(getTrialDate(), getTrialTime())}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{getTeacherType()} Teacher</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{getPlatform()}</span>
            </div>
          </div>
        </div>

        {getNotes() && (
          <div className="p-3 bg-muted/50 rounded-lg border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary/70" />
              <span className="text-sm font-medium">Booking Notes</span>
            </div>
            <p className="text-sm text-gray-700">{getNotes()}</p>
          </div>
        )}

        {renderTrialOutcomeSection()}

        {/* Status-Specific Action Buttons */}
        <div className="pt-2 border-t border-primary/10">
          {renderStatusSpecificActions()}
        </div>
      </CardContent>
    </Card>
  );
};
