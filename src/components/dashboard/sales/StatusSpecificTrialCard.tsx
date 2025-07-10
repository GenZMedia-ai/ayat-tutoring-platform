import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  CheckCircle,
  Package
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Pending' },
      'confirmed': { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Confirmed' },
      'trial-completed': { color: 'bg-green-50 text-green-700 border-green-200', label: 'Trial Completed' },
      'trial-ghosted': { color: 'bg-red-50 text-red-700 border-red-200', label: 'Trial Ghosted' },
      'follow-up': { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Follow-up' },
      'awaiting-payment': { color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Awaiting Payment' },
      'paid': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Paid' },
      'active': { color: 'bg-cyan-50 text-cyan-700 border-cyan-200', label: 'Active' },
      'expired': { color: 'bg-gray-50 text-gray-700 border-gray-200', label: 'Expired' },
      'cancelled': { color: 'bg-slate-50 text-slate-700 border-slate-200', label: 'Cancelled' },
      'dropped': { color: 'bg-slate-50 text-slate-700 border-slate-200', label: 'Dropped' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-50 text-gray-700 border-gray-200', label: status };
    return (
      <Badge className={`${config.color} border text-xs font-medium px-2 py-1`}>
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
        className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
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
        className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
      >
        <FileX className="h-4 w-4 mr-2" />
        Edit Info
      </Button>
    );

    const primaryActionButton = (text: string, icon: React.ReactNode, onClick: () => void) => (
      <Button 
        size="sm"
        onClick={onClick}
        className="bg-amber-600 hover:bg-amber-700 text-white border-0"
      >
        {icon}
        {text}
      </Button>
    );

    const dangerButton = (text: string, icon: React.ReactNode, onClick: () => void) => (
      <Button 
        variant="outline" 
        size="sm"
        onClick={onClick}
        className="border-red-200 text-red-700 hover:bg-red-50 bg-white"
      >
        {icon}
        {text}
      </Button>
    );

    const secondaryButton = (text: string, icon: React.ReactNode, onClick: () => void) => (
      <Button 
        variant="outline" 
        size="sm"
        onClick={onClick}
        className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-white"
      >
        {icon}
        {text}
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
            {onMarkAsDropped && 
              dangerButton(
                "Mark as Dropped", 
                <UserX className="h-4 w-4 mr-2" />, 
                () => onMarkAsDropped(item)
              )
            }
          </div>
        );

      case 'follow-up':
        return (
          <div className="flex flex-wrap gap-2">
            {editInfoButton}
            {commonContactButton}
            {onCreatePaymentLink && 
              primaryActionButton(
                "Create Payment Link", 
                <CreditCard className="h-4 w-4 mr-2" />, 
                () => onCreatePaymentLink(item)
              )
            }
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
      <CardContent className="p-6">
        {/* Header Section with Avatar */}
        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-12 w-12 bg-amber-100 text-amber-800 border-2 border-amber-200">
            <AvatarFallback className="bg-amber-100 text-amber-800 font-semibold">
              {getInitials(getName())}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-gray-900 text-lg">{getName()}</h3>
              {getStatusBadge(getStatus())}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="capitalize font-medium">{getTeacherType()} Teacher</span>
              <span>•</span>
              {isFamily ? (
                <span>{getStudentCount()} Students</span>
              ) : (
                <span>Age {getAge()}</span>
              )}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">{getUniqueId()}</div>
          </div>
        </div>

        {/* Information Section */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Phone:</span>
            <span className="text-gray-900">{getPhone()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Location:</span>
            <span className="text-gray-900">{getCountry()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Platform:</span>
            <span className="text-gray-900 capitalize">{getPlatform()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Trial Session:</span>
            <span className="text-gray-900">{formatDateTime(getTrialDate(), getTrialTime())}</span>
          </div>
        </div>

        {/* Trial Status Section */}
        {getStatus() === 'trial-completed' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-6">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Trial session completed successfully</span>
          </div>
        )}

        {/* Package Information */}
        {(getStatus() === 'paid' || getStatus() === 'active') && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <Package className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {getTeacherType()} Teacher • Basic-4 Package
            </span>
          </div>
        )}

        {/* Follow-up Alert */}
        {getStatus() === 'follow-up' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-800">Follow-up Scheduled</span>
            </div>
            <p className="text-sm text-amber-700">
              Next consultation needed for package selection and enrollment
            </p>
          </div>
        )}

        {/* Notes Section */}
        {getNotes() && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Notes</h4>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">{getNotes()}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          {renderStatusSpecificActions()}
        </div>
      </CardContent>
    </Card>
  );
};