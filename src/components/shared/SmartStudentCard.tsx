
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Phone, 
  MapPin, 
  User, 
  Video,
  Users
} from 'lucide-react';
import { useStudentJourneyNotes } from '@/hooks/useStudentJourneyNotes';
import { StudentNotesDisplay } from './StudentNotesDisplay';
import { format } from 'date-fns';

interface SmartStudentCardProps {
  student: any; // Can be individual student or family group
  type: 'individual' | 'family';
  onEdit?: () => void;
  onStatusChange?: () => void;
  onContact?: () => void;
  showActions?: boolean;
}

export const SmartStudentCard: React.FC<SmartStudentCardProps> = ({
  student,
  type,
  onEdit,
  onStatusChange,
  onContact,
  showActions = true
}) => {
  const isFamily = type === 'family';
  const studentId = student.id;
  
  const { journeyData, loading, getNotesForStatus } = useStudentJourneyNotes(studentId);
  
  // Get relevant notes for current status
  const currentNotes = journeyData ? getNotesForStatus(student.status) : [];

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

  const getName = () => isFamily ? student.parent_name || student.parentName : student.name;
  const getUniqueId = () => isFamily ? student.unique_id : student.uniqueId;
  const getPhone = () => student.phone;
  const getCountry = () => student.country;
  const getPlatform = () => student.platform;
  const getTrialDate = () => isFamily ? student.trial_date : student.trialDate;
  const getTrialTime = () => isFamily ? student.trial_time : student.trialTime;
  const getStudentCount = () => isFamily ? student.student_count : 1;
  const getAge = () => !isFamily ? student.age : null;

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
              {getStatusBadge(student.status)}
              <Badge variant="outline" className="text-xs">
                {isFamily ? 'Family' : 'Individual'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{getUniqueId()}</span>
              {isFamily ? (
                <span>{getStudentCount()} students</span>
              ) : (
                <span>Age: {getAge()}</span>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  Edit
                </Button>
              )}
              {onStatusChange && (
                <Button variant="outline" size="sm" onClick={onStatusChange}>
                  Status
                </Button>
              )}
              {onContact && (
                <Button variant="outline" size="sm" onClick={onContact}>
                  Contact
                </Button>
              )}
            </div>
          )}
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
          </div>
        </div>

        {/* Smart Notes Display - Shows notes relevant to current status */}
        {!loading && currentNotes.length > 0 && (
          <div className="pt-2 border-t">
            <StudentNotesDisplay 
              notes={currentNotes}
              status={student.status}
              compact={true}
              showTitle={false}
            />
          </div>
        )}

        {/* Status-specific additional info */}
        {student.status === 'trial-completed' && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-800 mb-1">✅ Trial Completed Successfully</p>
            <p className="text-xs text-green-700">Student is ready for payment link creation</p>
          </div>
        )}

        {student.status === 'trial-ghosted' && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm font-medium text-red-800 mb-1">👻 Trial Session Ghosted</p>
            <p className="text-xs text-red-700">Student did not attend the trial session</p>
          </div>
        )}

        {student.status === 'pending' && (
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm font-medium text-orange-800 mb-1">⏳ Awaiting Confirmation</p>
            <p className="text-xs text-orange-700">Trial session needs to be confirmed by teacher</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
