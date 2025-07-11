
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Phone, 
  MapPin, 
  User, 
  ChevronDown, 
  ChevronUp,
  MessageCircle,
  CreditCard,
  Video
} from 'lucide-react';
import { MixedStudentItem } from '@/hooks/useMixedStudentData';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudent } from '@/types/trial';
import { format } from 'date-fns';

interface ModernStudentCardProps {
  item: MixedStudentItem;
  onContact: (item: MixedStudentItem) => void;
  onScheduleFollowUp?: (item: MixedStudentItem) => void;
  onCreatePaymentLink?: (item: MixedStudentItem) => void;
}

export const ModernStudentCard: React.FC<ModernStudentCardProps> = ({
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
  const getUniqueId = () => isFamily ? (data as FamilyGroup).unique_id : (data as TrialSessionFlowStudent).uniqueId;
  const getStatus = () => data.status;
  const getPhone = () => data.phone;
  const getCountry = () => data.country;
  const getPlatform = () => data.platform;
  const getNotes = () => data.notes;
  const getTrialDate = () => isFamily ? (data as FamilyGroup).trial_date : (data as TrialSessionFlowStudent).trialDate;
  const getTrialTime = () => isFamily ? (data as FamilyGroup).trial_time : (data as TrialSessionFlowStudent).trialTime;
  const getTeacherType = () => isFamily ? (data as FamilyGroup).teacher_type : (data as TrialSessionFlowStudent).teacherType;
  const getAge = () => !isFamily ? (data as TrialSessionFlowStudent).age : null;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Pending Confirmation' },
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

  return (
    <Card className="bg-white border border-stone-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar Placeholder */}
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-stone-500" />
          </div>
          
          {/* Name, Age, ID */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-stone-900 text-lg">{getName()}</h3>
              {!isFamily && getAge() && (
                <span className="text-stone-600 text-sm">• {getAge()} years</span>
              )}
            </div>
            <div className="text-stone-500 text-sm font-mono">{getUniqueId()}</div>
          </div>
          
          {/* Status Badge */}
          <div>
            {getStatusBadge(getStatus())}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-stone-500" />
              <span className="text-stone-700">{getPhone()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-stone-500" />
              <span className="text-stone-700 capitalize">{getTeacherType()} Teacher</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Video className="h-4 w-4 text-stone-500" />
              <span className="text-stone-700 capitalize">{getPlatform()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-stone-500" />
              <span className="text-stone-700">{formatDateTime(getTrialDate(), getTrialTime())}</span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm mb-4">
          <MapPin className="h-4 w-4 text-stone-500" />
          <span className="text-stone-700">{getCountry()}</span>
        </div>

        {/* Notes Section */}
        {getNotes() && (
          <div className="mb-4">
            <button
              onClick={() => setNotesExpanded(!notesExpanded)}
              className="flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
            >
              <span>Notes</span>
              {notesExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {notesExpanded && (
              <div className="mt-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
                <p className="text-sm text-stone-700">{getNotes()}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-stone-200">
          <Button
            onClick={() => onContact(item)}
            variant="outline"
            size="sm"
            className="flex-1 border-stone-300 text-stone-700 hover:bg-stone-50"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact {isFamily ? 'Family' : 'Student'}
          </Button>
          
          {onScheduleFollowUp && (getStatus() === 'trial-completed' || getStatus() === 'follow-up') && (
            <Button
              onClick={() => onScheduleFollowUp(item)}
              variant="outline"
              size="sm"
              className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Follow-up
            </Button>
          )}
          
          {onCreatePaymentLink && (getStatus() === 'trial-completed' || getStatus() === 'awaiting-payment') && (
            <Button
              onClick={() => onCreatePaymentLink(item)}
              size="sm"
              className="flex-1 bg-stone-800 hover:bg-stone-900 text-white"
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
