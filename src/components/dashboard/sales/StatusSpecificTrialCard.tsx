
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Phone, 
  MapPin, 
  User, 
  Edit2, 
  MessageCircle,
  CreditCard,
  Eye,
  Copy,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  UserCheck,
  UserX,
  RefreshCw
} from 'lucide-react';
import { MixedStudentItem } from '@/hooks/useMixedStudentData';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudent } from '@/types/trial';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface StatusSpecificTrialCardProps {
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
  const data = item.data;
  const name = item.type === 'family' 
    ? (data as FamilyGroup).parent_name 
    : (data as TrialSessionFlowStudent).name;
  const uniqueId = item.type === 'family'
    ? (data as FamilyGroup).unique_id
    : (data as TrialSessionFlowStudent).uniqueId;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      'pending': { variant: 'warning', label: 'Pending' },
      'confirmed': { variant: 'default', label: 'Confirmed' },
      'trial-completed': { variant: 'success', label: 'Trial Completed' },
      'trial-ghosted': { variant: 'destructive', label: 'Trial Ghosted' },
      'awaiting-payment': { variant: 'warning', label: 'Awaiting Payment' },
      'paid': { variant: 'success', label: 'Paid' },
      'active': { variant: 'default', label: 'Active' },
      'expired': { variant: 'secondary', label: 'Expired' },
      'cancelled': { variant: 'destructive', label: 'Cancelled' },
      'dropped': { variant: 'secondary', label: 'Dropped' }
    };

    const config = statusConfig[status] || { variant: 'secondary', label: status };
    return (
      <Badge variant={config.variant} className="sales-badge">
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

  // Helper functions to get properties based on item type
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

  const renderActionButtons = () => {
    switch (data.status) {
      case 'pending':
        return (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="sales-btn-primary" onClick={() => onContact(item)}>
              <MessageCircle className="h-4 w-4 mr-1" />
              Contact
            </Button>
            <Button size="sm" className="sales-btn-secondary" onClick={() => onEditInfo(item)}>
              <Edit2 className="h-4 w-4 mr-1" />
              Edit Info
            </Button>
            <Button size="sm" className="sales-btn-ghost" onClick={() => onRescheduleAppointment(item)}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reschedule
            </Button>
          </div>
        );

      case 'confirmed':
        return (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="sales-btn-primary" onClick={() => onContact(item)}>
              <MessageCircle className="h-4 w-4 mr-1" />
              Remind
            </Button>
            <Button size="sm" className="sales-btn-ghost" onClick={() => onRescheduleAppointment(item)}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reschedule
            </Button>
          </div>
        );

      case 'trial-completed':
        return (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="sales-btn-primary" onClick={() => onCreatePaymentLink(item)}>
              <CreditCard className="h-4 w-4 mr-1" />
              Create Payment Link
            </Button>
            <Button size="sm" className="sales-btn-secondary" onClick={() => onScheduleFollowUp(item)}>
              <Calendar className="h-4 w-4 mr-1" />
              Schedule Follow-up
            </Button>
            <Button size="sm" className="sales-btn-ghost" onClick={() => onContact(item)}>
              <MessageCircle className="h-4 w-4 mr-1" />
              Contact
            </Button>
          </div>
        );

      case 'trial-ghosted':
        return (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="sales-btn-primary" onClick={() => onContact(item)}>
              <MessageCircle className="h-4 w-4 mr-1" />
              Follow Up
            </Button>
            <Button size="sm" className="sales-btn-secondary" onClick={() => onRescheduleAppointment(item)}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reschedule
            </Button>
            <Button size="sm" className="sales-btn-ghost" onClick={() => onMarkAsDropped(item)}>
              <UserX className="h-4 w-4 mr-1" />
              Mark as Dropped
            </Button>
          </div>
        );

      case 'awaiting-payment':
        return (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="sales-btn-primary" onClick={() => onContact(item)}>
              <MessageCircle className="h-4 w-4 mr-1" />
              Send Reminder
            </Button>
            <Button size="sm" className="sales-btn-secondary" onClick={() => onRecreatePaymentLink(item)}>
              <CreditCard className="h-4 w-4 mr-1" />
              Recreate Link
            </Button>
            <Button size="sm" className="sales-btn-ghost" onClick={() => onCompleteFollowUp(item)}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Mark as Paid
            </Button>
          </div>
        );

      case 'paid':
        return (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="sales-btn-primary" onClick={() => onContact(item)}>
              <MessageCircle className="h-4 w-4 mr-1" />
              Welcome Message
            </Button>
            <Button size="sm" className="sales-btn-secondary">
              <UserCheck className="h-4 w-4 mr-1" />
              Complete Registration
            </Button>
          </div>
        );

      default:
        return (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="sales-btn-ghost" onClick={() => onContact(item)}>
              <MessageCircle className="h-4 w-4 mr-1" />
              Contact
            </Button>
            <Button size="sm" className="sales-btn-ghost" onClick={() => onEditInfo(item)}>
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        );
    }
  };

  return (
    <Card className="sales-card hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="sales-heading-4">{name}</h3>
              {getStatusBadge(data.status)}
              {item.type === 'family' && (
                <Badge variant="outline" className="sales-badge">
                  <Users className="h-3 w-3 mr-1" />
                  Family
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{uniqueId}</span>
              {item.type === 'individual' && (
                <span>Age: {(data as TrialSessionFlowStudent).age}</span>
              )}
              {item.type === 'family' && (
                <span>Students: {(data as FamilyGroup).student_count}</span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{data.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{data.country}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{data.platform}</span>
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

        {/* Notes Section */}
        {data.notes && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary/70" />
              <span className="text-sm font-medium">Notes</span>
            </div>
            <p className="text-sm text-muted-foreground">{data.notes}</p>
          </div>
        )}

        {/* Status-Specific Information */}
        {data.status === 'trial-completed' && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Trial Completed Successfully</span>
            </div>
            <p className="text-sm text-green-700">Ready for payment link creation and enrollment</p>
          </div>
        )}

        {data.status === 'trial-ghosted' && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Student Did Not Attend</span>
            </div>
            <p className="text-sm text-red-700">Follow up required to reschedule or determine next steps</p>
          </div>
        )}

        {data.status === 'awaiting-payment' && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Payment Link Sent</span>
            </div>
            <p className="text-sm text-amber-700">Waiting for student to complete payment process</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-border">
          {renderActionButtons()}
        </div>
      </CardContent>
    </Card>
  );
};
