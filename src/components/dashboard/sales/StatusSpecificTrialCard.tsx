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
  UserX
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-purple-50 text-purple-800', label: 'Pending' },
      'confirmed': { color: 'bg-gray-100 text-gray-800', label: 'Confirmed' },
      'trial-completed': { color: 'bg-green-50 text-green-800', label: 'Trial Completed' },
      'trial-ghosted': { color: 'bg-red-50 text-red-800', label: 'Trial Ghosted' },
      'follow-up': { color: 'bg-amber-50 text-amber-800', label: 'Follow-up' },
      'awaiting-payment': { color: 'bg-orange-50 text-orange-800', label: 'Awaiting Payment' },
      'paid': { color: 'bg-green-50 text-green-800', label: 'Paid' },
      'active': { color: 'bg-blue-50 text-blue-800', label: 'Active' },
      'expired': { color: 'bg-gray-100 text-gray-800', label: 'Expired' },
      'cancelled': { color: 'bg-red-50 text-red-800', label: 'Cancelled' },
      'dropped': { color: 'bg-gray-100 text-gray-800', label: 'Dropped' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <Badge className={`${config.color} border-0 text-xs font-medium px-3 py-1`}>
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

  const renderStatusSpecificActions = () => {
    const status = getStatus();
    const commonContactButton = (
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => onContact(item)}
        className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 h-8 px-3 text-sm font-medium"
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
        className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 h-8 px-3 text-sm font-medium"
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
                size="sm"
                onClick={() => onCreatePaymentLink(item)}
                className="bg-slate-800 hover:bg-slate-700 text-white h-8 px-3 text-sm font-medium"
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
    <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-4 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                {isFamily ? (
                  <Users className="h-4 w-4 text-gray-500" />
                ) : (
                  <User className="h-4 w-4 text-gray-500" />
                )}
                <h3 className="font-semibold text-lg text-gray-900">{getName()}</h3>
              </div>
              {getStatusBadge(getStatus())}
              <Badge className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border-0">
                {isFamily ? 'Family' : 'Individual'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-mono text-gray-500">{getUniqueId()}</span>
              {isFamily ? (
                <span className="text-gray-600">{getStudentCount()} students</span>
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

      <CardContent className="space-y-4 p-6 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{getPhone()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{getCountry()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{formatDateTime(getTrialDate(), getTrialTime())}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User className="h-4 w-4 text-gray-500" />
              <span className="capitalize">{getTeacherType()} Teacher</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="capitalize">{getPlatform()}</span>
            </div>
          </div>
        </div>

        {getNotes() && (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              <strong className="text-gray-900">Notes:</strong> {getNotes()}
            </p>
          </div>
        )}

        {/* Status-Specific Action Buttons */}
        <div className="pt-4 border-t border-gray-200">
          {renderStatusSpecificActions()}
        </div>
      </CardContent>
    </Card>
  );
};