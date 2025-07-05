
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
  Eye,
  Copy
} from 'lucide-react';
import { TrialSessionFlowStudent } from '@/types/trial';
import { useSalesPermissions } from '@/hooks/useSalesPermissions';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface StudentTrialCardProps {
  student: TrialSessionFlowStudent;
  onEdit: (student: TrialSessionFlowStudent) => void;
  onStatusChange: (student: TrialSessionFlowStudent) => void;
  onRefresh: () => void;
}

export const StudentTrialCard: React.FC<StudentTrialCardProps> = ({
  student,
  onEdit,
  onStatusChange,
  onRefresh
}) => {
  const permissions = useSalesPermissions(student.status);

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

  // CRITICAL FIX: Smart payment link button logic with stored URL support
  const handlePaymentLinkAction = () => {
    if (student.paymentLink) {
      // Try to use stored URL first, fallback to session ID
      const url = student.paymentLink.stripeCheckoutUrl || 
                 (student.paymentLink.stripeSessionId ? 
                  `https://checkout.stripe.com/c/pay/${student.paymentLink.stripeSessionId}` : 
                  null);
      
      if (url) {
        navigator.clipboard.writeText(url);
        if (student.paymentLink.stripeCheckoutUrl) {
          toast.success('Payment link copied to clipboard');
        } else {
          toast.warning('Payment link copied (legacy format - might not work)');
        }
      } else {
        toast.error('No valid payment link available');
      }
    } else {
      // No payment link exists - create one
      toast.info('Opening payment link creation form...');
      // This would trigger the payment link creation modal
    }
  };

  const openPaymentLink = () => {
    if (student.paymentLink) {
      // Try to use stored URL first, fallback to session ID
      const url = student.paymentLink.stripeCheckoutUrl || 
                 (student.paymentLink.stripeSessionId ? 
                  `https://checkout.stripe.com/c/pay/${student.paymentLink.stripeSessionId}` : 
                  null);
      
      if (url) {
        window.open(url, '_blank');
        if (!student.paymentLink.stripeCheckoutUrl) {
          toast.warning('Opening legacy payment link - this might not work');
        }
      } else {
        toast.error('No valid payment link available');
      }
    }
  };

  // Check if valid payment link exists (either stored URL or session ID)
  const hasPaymentLink = student.paymentLink && 
    (student.paymentLink.stripeCheckoutUrl || student.paymentLink.stripeSessionId);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">{student.name}</h3>
              {getStatusBadge(student.status)}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{student.uniqueId}</span>
              <span>Age: {student.age}</span>
              {student.parentName && (
                <span>Parent: {student.parentName}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {permissions.canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(student)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {permissions.canChangeStatus && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(student)}
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
              <span>{student.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{student.country}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{student.platform}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDateTime(student.trialDate, student.trialTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{student.teacherType} Teacher</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className={`p-3 bg-muted rounded-lg ${!student.notes ? 'invisible' : ''}`}>
          <p className="text-sm">
            <strong>Notes:</strong> {student.notes || 'No notes available'}
          </p>
        </div>

        {/* Last Contact Info */}
        <div className={`p-3 bg-blue-50 rounded-lg ${!student.lastWhatsAppContact ? 'invisible' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Last Contact</span>
          </div>
          <p className="text-sm text-blue-700">
            {student.lastWhatsAppContact?.success ? 'Successful' : 'Failed'} contact on{' '}
            {student.lastWhatsAppContact ? format(new Date(student.lastWhatsAppContact.contactedAt), 'MMM dd, yyyy') : 'N/A'}
          </p>
          {student.lastWhatsAppContact?.notes && (
            <p className="text-sm text-blue-600 mt-1">
              {student.lastWhatsAppContact.notes}
            </p>
          )}
        </div>

        {/* Payment Link Info */}
        <div className={`p-3 bg-purple-50 rounded-lg ${!student.paymentLink ? 'invisible' : ''}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Payment Link</span>
              {/* Show URL type indicator */}
              {student.paymentLink?.stripeCheckoutUrl ? (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  Secure URL
                </Badge>
              ) : student.paymentLink ? (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                  Legacy
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700">
                  N/A
                </Badge>
              )}
            </div>
            <Badge className={`${
              student.paymentLink?.status === 'paid' ? 'bg-green-100 text-green-800' :
              student.paymentLink?.status === 'clicked' ? 'bg-yellow-100 text-yellow-800' :
              student.paymentLink?.status === 'expired' ? 'bg-red-100 text-red-800' :
              'bg-purple-100 text-purple-800'
            } border-0`}>
              {student.paymentLink?.status || 'None'}
            </Badge>
          </div>
          <p className="text-sm text-purple-700">
            Amount: {student.paymentLink ? `${student.paymentLink.currency.toUpperCase()} ${(student.paymentLink.amount / 100).toFixed(2)}` : 'N/A'}
          </p>
          {student.paymentLink?.clickedAt && (
            <p className="text-sm text-purple-600">
              Clicked: {format(new Date(student.paymentLink.clickedAt), 'MMM dd, yyyy HH:mm')}
            </p>
          )}
        </div>

        {/* Follow-up Info */}
        <div className={`p-3 bg-yellow-50 rounded-lg ${!student.pendingFollowUp || student.pendingFollowUp.completed ? 'invisible' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Pending Follow-up</span>
          </div>
          <p className="text-sm text-yellow-700">
            Scheduled: {student.pendingFollowUp ? format(new Date(student.pendingFollowUp.scheduledDate), 'MMM dd, yyyy') : 'N/A'}
          </p>
          <p className="text-sm text-yellow-600">
            Reason: {student.pendingFollowUp?.reason || 'N/A'}
          </p>
        </div>

        {/* Action Buttons */}
        {(permissions.canCreatePaymentLink || permissions.canCreateFollowUp) && (
          <div className="flex gap-2 pt-2 border-t">
            {/* Smart Payment Link Button */}
            {hasPaymentLink ? (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePaymentLinkAction}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={openPaymentLink}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Link
                </Button>
              </div>
            ) : (
              permissions.canCreatePaymentLink && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePaymentLinkAction}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Create Payment Link
                </Button>
              )
            )}
            
            {permissions.canCreateFollowUp && !student.pendingFollowUp && (
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Follow-up
              </Button>
            )}
            {student.paymentLink && student.paymentLink.status === 'pending' && (
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Payment
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
