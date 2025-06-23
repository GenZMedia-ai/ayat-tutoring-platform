
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Users, Phone, Globe, MessageSquare, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { TeacherMixedTrialItem, TeacherTrialStudent, TeacherTrialFamily } from '@/hooks/useTeacherMixedTrialData';
import WhatsAppContactButton from './WhatsAppContactButton';

interface UnifiedTeacherStudentCardProps {
  item: TeacherMixedTrialItem;
  onContact: (phone: string, name: string) => void;
  onConfirm: (item: TeacherMixedTrialItem) => void;
  onMarkCompleted: (item: TeacherMixedTrialItem) => void;
  onMarkGhosted: (item: TeacherMixedTrialItem) => void;
  onReschedule: (item: TeacherMixedTrialItem) => void;
}

export const UnifiedTeacherStudentCard: React.FC<UnifiedTeacherStudentCardProps> = ({
  item,
  onContact,
  onConfirm,
  onMarkCompleted,
  onMarkGhosted,
  onReschedule
}) => {
  const data = item.data;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'trial-completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'trial-ghosted': return 'bg-red-100 text-red-800 border-red-300';
      case 'rescheduled': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getName = () => {
    if (item.type === 'individual') {
      return (data as TeacherTrialStudent).name;
    } else {
      return (data as TeacherTrialFamily).parentName;
    }
  };

  const getDisplayInfo = () => {
    if (item.type === 'individual') {
      const student = data as TeacherTrialStudent;
      return {
        icon: <User className="h-4 w-4" />,
        title: student.name,
        subtitle: `Age: ${student.age} • ${student.uniqueId}`,
        phone: student.phone,
        country: student.country
      };
    } else {
      const family = data as TeacherTrialFamily;
      return {
        icon: <Users className="h-4 w-4" />,
        title: family.parentName,
        subtitle: `Family Trial • ${family.studentCount} students • ${family.uniqueId}`,
        phone: family.phone,
        country: family.country
      };
    }
  };

  // Create a student object for WhatsAppContactButton
  const createStudentForWhatsApp = () => {
    if (item.type === 'individual') {
      const student = data as TeacherTrialStudent;
      return {
        id: student.id,
        name: student.name,
        phone: student.phone,
        trialDate: student.trialDate,
        trialTime: student.trialTime
      };
    } else {
      const family = data as TeacherTrialFamily;
      return {
        id: family.id,
        name: family.parentName,
        phone: family.phone,
        trialDate: family.trialDate,
        trialTime: family.trialTime
      };
    }
  };

  const displayInfo = getDisplayInfo();
  const canMarkAsCompleted = data.status === 'confirmed';
  const canConfirm = data.status === 'pending';
  const isCompleted = data.status === 'trial-completed' || data.status === 'trial-ghosted';

  return (
    <Card className="transition-all duration-200 hover:shadow-md border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {displayInfo.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{displayInfo.title}</h3>
                <p className="text-sm text-muted-foreground">{displayInfo.subtitle}</p>
                <Badge className={`mt-2 ${getStatusColor(data.status)}`}>
                  {data.status.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 px-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{displayInfo.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{displayInfo.country}</span>
            </div>
          </div>

          {/* Trial Information */}
          {data.trialDate && data.trialTime && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{data.trialDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{data.trialTime}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {data.notes && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">{data.notes}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {/* Contact Button */}
            <WhatsAppContactButton
              student={createStudentForWhatsApp()}
              contactType="trial_confirmation"
              size="sm"
              onContactLogged={() => onContact(displayInfo.phone, getName())}
            />

            {/* Confirm Button */}
            {canConfirm && (
              <Button
                size="sm"
                onClick={() => onConfirm(item)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirm Trial
              </Button>
            )}

            {/* Trial Outcome Buttons */}
            {canMarkAsCompleted && (
              <>
                <Button
                  size="sm"
                  onClick={() => onMarkCompleted(item)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Completed
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onMarkGhosted(item)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Mark Ghosted
                </Button>
              </>
            )}

            {/* Reschedule Button - Now enabled for all trial types */}
            {!isCompleted && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReschedule(item)}
                className="border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reschedule
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
