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
  Users,
  Plus,
  AlertCircle,
  CheckCircle,
  FileText,
  Target,
  Star
} from 'lucide-react';
import { MixedStudentItem } from '@/hooks/useMixedStudentData';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudent } from '@/types/trial';
import { useRoleBasedPermissions, useDisplayPriority } from '@/hooks/useRoleBasedPermissions';
import { format } from 'date-fns';

interface UnifiedTrialCardProps {
  item: MixedStudentItem;
  onEdit?: (item: MixedStudentItem) => void;
  onStatusChange?: (item: MixedStudentItem) => void;
  onContact?: (item: MixedStudentItem) => void;
  onCreatePaymentLink?: (item: MixedStudentItem) => void;
  onScheduleFollowUp?: (item: MixedStudentItem) => void;
  onCompleteFollowUp?: (item: MixedStudentItem) => void;
  onRefresh?: () => void;
  showActions?: boolean;
}

export const UnifiedTrialCard: React.FC<UnifiedTrialCardProps> = ({
  item,
  onEdit,
  onStatusChange,
  onContact,
  onCreatePaymentLink,
  onScheduleFollowUp,
  onCompleteFollowUp,
  onRefresh,
  showActions = true
}) => {
  const isFamily = item.type === 'family';
  const data = item.data;
  const permissions = useRoleBasedPermissions();

  // Helper functions for accessing data
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

  const getLastWhatsAppContact = () => !isFamily ? (data as TrialSessionFlowStudent).lastWhatsAppContact : null;
  const getPaymentLink = () => !isFamily ? (data as TrialSessionFlowStudent).paymentLink : null;
  const getPendingFollowUp = () => !isFamily ? (data as TrialSessionFlowStudent).pendingFollowUp : null;

  const displayPriority = useDisplayPriority(getStatus());

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


  const shouldShowPaymentLink = () => {
    const status = getStatus();
    return (status === 'trial-completed' || status === 'follow-up' || status === 'awaiting-payment') && !getPaymentLink();
  };

  const shouldShowScheduleFollowUp = () => {
    const status = getStatus();
    return status === 'trial-completed' && !getPendingFollowUp();
  };

  const shouldShowCompleteFollowUp = () => {
    const status = getStatus();
    return status === 'follow-up' && getPendingFollowUp() && !getPendingFollowUp()!.completed;
  };

  const shouldShowRescheduleFollowUp = () => {
    const status = getStatus();
    return status === 'follow-up' && getPendingFollowUp() && !getPendingFollowUp()!.completed;
  };

  const shouldShowViewPaymentLink = () => {
    const paymentLink = getPaymentLink();
    return paymentLink && paymentLink.status === 'pending';
  };

  const renderSmartNotesDisplay = () => {
    const sections = [];
    const studentData = !isFamily ? (data as TrialSessionFlowStudent) : null;

    // 1. Last Contact Information (for all roles when available)
    if (!isFamily && getLastWhatsAppContact() && permissions.canViewSalesNotes) {
      sections.push(
        <div key="contact" className="p-3 bg-accent rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Last Contact</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {getLastWhatsAppContact()!.success ? 'Successful' : 'Failed'} contact on{' '}
            {format(new Date(getLastWhatsAppContact()!.contactedAt), 'MMM dd, yyyy')}
          </p>
          {getLastWhatsAppContact()!.notes && (
            <p className="text-sm text-foreground mt-1">
              {getLastWhatsAppContact()!.notes}
            </p>
          )}
        </div>
      );
    }

    // 2. Trial Outcome Details (for completed/ghosted trials)
    if (!isFamily && studentData?.trialOutcome && permissions.canViewTrialOutcomes) {
      const outcome = studentData.trialOutcome;
      const isCompleted = outcome.outcome === 'completed';
      
      sections.push(
        <div key="trial-outcome" className="p-3 bg-muted rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            {isCompleted ? (
              <CheckCircle className="h-4 w-4 text-primary" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <span className="text-sm font-medium text-foreground">
              Trial {outcome.outcome === 'completed' ? 'Completed' : 'Outcome'}
            </span>
          </div>
          
          {permissions.canViewTeacherNotes && outcome.teacherNotes && (
            <div className="mb-2">
              <div className="flex items-center gap-1 mb-1">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Teacher Notes</span>
              </div>
              <p className="text-sm">{outcome.teacherNotes}</p>
            </div>
          )}
          
          {permissions.canViewStudentBehavior && outcome.studentBehavior && (
            <div className="mb-2">
              <div className="flex items-center gap-1 mb-1">
                <Star className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Student Behavior</span>
              </div>
              <p className="text-sm">{outcome.studentBehavior}</p>
            </div>
          )}
          
          {permissions.canViewRecommendedPackages && outcome.recommendedPackage && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Recommended Package</span>
              </div>
              <p className="text-sm">{outcome.recommendedPackage}</p>
            </div>
          )}
        </div>
      );
    }

    // 3. Payment Link (ONLY for admin role)
    if (!isFamily && getPaymentLink() && permissions.canViewPaymentLinks && permissions.canViewFinancialData) {
      sections.push(
        <div key="payment" className="p-3 bg-accent rounded-lg border border-border">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Payment Link</span>
            </div>
            <Badge className={`${
              getPaymentLink()!.status === 'paid' ? 'status-paid' :
              getPaymentLink()!.status === 'clicked' ? 'status-pending' :
              getPaymentLink()!.status === 'expired' ? 'status-expired' :
              'bg-secondary/10 text-secondary border border-secondary/20'
            }`}>
              {getPaymentLink()!.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Amount: {getPaymentLink()!.currency.toUpperCase()} {(getPaymentLink()!.amount / 100).toFixed(2)}
          </p>
        </div>
      );
    }

    // 4. Payment Status (for non-admin roles) - shows status without amounts
    if (!isFamily && getPaymentLink() && !permissions.canViewFinancialData) {
      sections.push(
        <div key="payment-status" className="p-3 bg-accent rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Payment Status</span>
            </div>
            <Badge className={`${
              getPaymentLink()!.status === 'paid' ? 'status-paid' :
              getPaymentLink()!.status === 'clicked' ? 'status-pending' :
              getPaymentLink()!.status === 'expired' ? 'status-expired' :
              'bg-secondary/10 text-secondary border border-secondary/20'
            }`}>
              {getPaymentLink()!.status}
            </Badge>
          </div>
        </div>
      );
    }

    // 5. Follow-up Information (only for sales and admin)
    if (!isFamily && getPendingFollowUp() && !getPendingFollowUp()!.completed && permissions.canViewFollowUpData) {
      sections.push(
        <div key="followup" className="p-3 bg-muted rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Pending Follow-up</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Scheduled: {format(new Date(getPendingFollowUp()!.scheduledDate), 'MMM dd, yyyy')}
          </p>
          <p className="text-sm text-foreground">
            Reason: {getPendingFollowUp()!.reason}
          </p>
        </div>
      );
    }

    return <div className="space-y-3">{sections}</div>;
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
          <div className="flex gap-2">
            {showActions && onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => onEdit(item)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {showActions && onStatusChange && (
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => onStatusChange(item)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
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

        <div className={`p-3 bg-muted/50 rounded-lg border border-primary/10 ${!getNotes() ? 'invisible' : ''}`}>
          <p className="text-sm">
            <strong>Notes:</strong> {getNotes() || 'No notes available'}
          </p>
        </div>

        {/* Smart Role-Based Information Display */}
        {renderSmartNotesDisplay()}

        {showActions && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-primary/10">
            {onContact && (
              <Button 
                variant="outline" 
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => onContact(item)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact {isFamily ? 'Family' : 'Student'}
              </Button>
            )}

            {shouldShowPaymentLink() && onCreatePaymentLink && permissions.canViewFinancialData && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onCreatePaymentLink(item)}
                className="bg-green-600 hover:bg-green-700 border-0"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Create Payment Link
              </Button>
            )}

            {shouldShowViewPaymentLink() && permissions.canViewFinancialData && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const link = getPaymentLink();
                  if (link?.stripeSessionId) {
                    // In a real implementation, you'd have the actual URL
                    navigator.clipboard.writeText(link.stripeSessionId);
                  }
                }}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Payment Link
              </Button>
            )}

            {shouldShowScheduleFollowUp() && onScheduleFollowUp && permissions.canViewFollowUpData && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onScheduleFollowUp(item)}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Follow-up
              </Button>
            )}

            {shouldShowCompleteFollowUp() && onCompleteFollowUp && permissions.canViewFollowUpData && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onCompleteFollowUp(item)}
                className="bg-green-600 hover:bg-green-700 border-0"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Follow-up
              </Button>
            )}

            {shouldShowRescheduleFollowUp() && onScheduleFollowUp && permissions.canViewFollowUpData && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onScheduleFollowUp(item)}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <Clock className="h-4 w-4 mr-2" />
                Reschedule Follow-up
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
