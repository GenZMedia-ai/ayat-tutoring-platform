
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
  Edit2, 
  MoreHorizontal,
  MessageCircle,
  CreditCard,
  ExternalLink,
  Video,
  Users
} from 'lucide-react';
import { MixedStudentItem } from '@/hooks/useMixedStudentData';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudent } from '@/types/trial';
import { format } from 'date-fns';

interface UnifiedTrialCardProps {
  item: MixedStudentItem;
  onEdit?: (item: MixedStudentItem) => void;
  onStatusChange?: (item: MixedStudentItem) => void;
  onContact?: (item: MixedStudentItem) => void;
  onRefresh?: () => void;
  showActions?: boolean;
}

export const UnifiedTrialCard: React.FC<UnifiedTrialCardProps> = ({
  item,
  onEdit,
  onStatusChange,
  onContact,
  onRefresh,
  showActions = true
}) => {
  const isFamily = item.type === 'family';
  const data = item.data;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-orange-100 text-orange-800', label: 'Pending' },
      'confirmed': { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      'trial-completed': { color: 'bg-green-100 text-green-800', label: 'Trial Completed' },
      'trial-ghosted': { color: 'bg-red-100 text-red-800', label: 'Trial Ghosted' },
      'awaiting-payment': { color: 'bg-purple-100 text-purple-800', label: 'Awaiting Payment' },
      'paid': { color: 'bg-emerald-100 text-emerald-800', label: 'Paid' },
      'active': { color: 'bg-cyan-100 text-cyan-800', label: 'Active' },
      'expired': { color: 'bg-gray-100 text-gray-800', label: 'Expired' },
      'cancelled': { color: 'bg-slate-100 text-slate-800', label: 'Cancelled' },
      'dropped': { color: 'bg-slate-100 text-slate-800', label: 'Dropped' }
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
      const dateTime = new Date(`${date}T${time}`);
      return format(dateTime, 'MMM dd, yyyy at HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const getName = () => {
    if (isFamily) {
      return (data as FamilyGroup).parent_name;
    }
    return (data as TrialSessionFlowStudent).name;
  };

  const getUniqueId = () => {
    if (isFamily) {
      return (data as FamilyGroup).unique_id;
    }
    return (data as TrialSessionFlowStudent).uniqueId;
  };

  const getStatus = () => {
    return data.status;
  };

  const getPhone = () => {
    return data.phone;
  };

  const getCountry = () => {
    return data.country;
  };

  const getPlatform = () => {
    return data.platform;
  };

  const getNotes = () => {
    return data.notes;
  };

  const getTrialDate = () => {
    if (isFamily) {
      return (data as FamilyGroup).trial_date;
    }
    return (data as TrialSessionFlowStudent).trialDate;
  };

  const getTrialTime = () => {
    if (isFamily) {
      return (data as FamilyGroup).trial_time;
    }
    return (data as TrialSessionFlowStudent).trialTime;
  };

  const getTeacherType = () => {
    if (isFamily) {
      return (data as FamilyGroup).teacher_type;
    }
    return (data as TrialSessionFlowStudent).teacherType;
  };

  const getStudentCount = () => {
    if (isFamily) {
      return (data as FamilyGroup).student_count;
    }
    return 1; // Individual student
  };

  const getAge = () => {
    if (!isFamily) {
      return (data as TrialSessionFlowStudent).age;
    }
    return null;
  };

  const getParentName = () => {
    if (!isFamily) {
      return (data as TrialSessionFlowStudent).parentName;
    }
    return null;
  };

  // Get individual student specific data
  const getLastWhatsAppContact = () => {
    if (!isFamily) {
      return (data as TrialSessionFlowStudent).lastWhatsAppContact;
    }
    return null;
  };

  const getPaymentLink = () => {
    if (!isFamily) {
      return (data as TrialSessionFlowStudent).paymentLink;
    }
    return null;
  };

  const getPendingFollowUp = () => {
    if (!isFamily) {
      return (data as TrialSessionFlowStudent).pendingFollowUp;
    }
    return null;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
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
              <Badge variant="outline" className="text-xs">
                {isFamily ? 'Family' : 'Individual'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{getUniqueId()}</span>
              {isFamily ? (
                <span>{getStudentCount()} students</span>
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
          <div className="flex gap-2">
            {showActions && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(item)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {showActions && onStatusChange && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(item)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
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
              <Video className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{getPlatform()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDateTime(getTrialDate(), getTrialTime())}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{getTeacherType()} Teacher</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {getNotes() && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Notes:</strong> {getNotes()}
            </p>
          </div>
        )}

        {/* Individual Student Specific Information */}
        {!isFamily && (
          <>
            {/* Last Contact Info */}
            {getLastWhatsAppContact() && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Last Contact</span>
                </div>
                <p className="text-sm text-blue-700">
                  {getLastWhatsAppContact()!.success ? 'Successful' : 'Failed'} contact on{' '}
                  {format(new Date(getLastWhatsAppContact()!.contactedAt), 'MMM dd, yyyy')}
                </p>
                {getLastWhatsAppContact()!.notes && (
                  <p className="text-sm text-blue-600 mt-1">
                    {getLastWhatsAppContact()!.notes}
                  </p>
                )}
              </div>
            )}

            {/* Payment Link Info */}
            {getPaymentLink() && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Payment Link</span>
                  </div>
                  <Badge className={`${
                    getPaymentLink()!.status === 'paid' ? 'bg-green-100 text-green-800' :
                    getPaymentLink()!.status === 'clicked' ? 'bg-yellow-100 text-yellow-800' :
                    getPaymentLink()!.status === 'expired' ? 'bg-red-100 text-red-800' :
                    'bg-purple-100 text-purple-800'
                  } border-0`}>
                    {getPaymentLink()!.status}
                  </Badge>
                </div>
                <p className="text-sm text-purple-700">
                  Amount: {getPaymentLink()!.currency.toUpperCase()} {(getPaymentLink()!.amount / 100).toFixed(2)}
                </p>
              </div>
            )}

            {/* Follow-up Info */}
            {getPendingFollowUp() && !getPendingFollowUp()!.completed && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Pending Follow-up</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Scheduled: {format(new Date(getPendingFollowUp()!.scheduledDate), 'MMM dd, yyyy')}
                </p>
                <p className="text-sm text-yellow-600">
                  Reason: {getPendingFollowUp()!.reason}
                </p>
              </div>
            )}
          </>
        )}

        {/* Contact Action */}
        {showActions && onContact && (
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onContact(item)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact {isFamily ? 'Family' : 'Student'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
