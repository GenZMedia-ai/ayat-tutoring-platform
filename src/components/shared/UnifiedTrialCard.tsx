
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Edit, Calendar, CreditCard, Clock, Phone, MapPin, Users } from 'lucide-react';
import { ScheduleFollowupModal } from '@/components/sales/ScheduleFollowupModal';

interface UnifiedTrialCardProps {
  item: any;
  onEdit: (item: any) => void;
  onStatusChange: (item: any) => void;
  onContact: (item: any) => void;
  onCreatePaymentLink: (item: any) => void;
  onRefresh: () => void;
}

export const UnifiedTrialCard: React.FC<UnifiedTrialCardProps> = ({
  item,
  onEdit,
  onStatusChange,
  onContact,
  onCreatePaymentLink,
  onRefresh
}) => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const data = item.data;
  const isFamily = item.type === 'family';
  
  const getName = () => {
    return isFamily ? data.parent_name : data.name;
  };
  
  const getUniqueId = () => {
    return isFamily ? data.unique_id : data.uniqueId;
  };
  
  const getAge = () => {
    return isFamily ? `${data.student_count} students` : `Age: ${data.age}`;
  };
  
  const getTrialDate = () => {
    return isFamily ? data.trial_date : data.trialDate;
  };
  
  const getTrialTime = () => {
    return isFamily ? data.trial_time : data.trialTime;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'trial-completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'trial-ghosted': return 'bg-red-100 text-red-800 border-red-200';
      case 'awaiting-payment': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'active': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'dropped': return 'bg-stone-100 text-stone-800 border-stone-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleScheduleFollowup = () => {
    setShowScheduleModal(true);
  };

  const handleScheduleSuccess = () => {
    setShowScheduleModal(false);
    onRefresh();
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {isFamily && <Users className="h-4 w-4" />}
                {getName()}
              </CardTitle>
              <CardDescription>
                {getUniqueId()} • {getAge()} • {data.country}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge className={getStatusColor(data.status)}>
                {formatStatus(data.status)}
              </Badge>
              <Badge variant="outline">
                {isFamily ? 'Family' : 'Individual'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{data.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{data.platform}</span>
            </div>
            {getTrialDate() && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{getTrialDate()}</span>
              </div>
            )}
            {getTrialTime() && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{getTrialTime()}</span>
              </div>
            )}
          </div>
          
          {data.notes && (
            <div className="p-3 bg-muted rounded-md">
              <span className="font-medium text-sm">Notes:</span>
              <p className="text-sm mt-1">{data.notes}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onContact(item)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleScheduleFollowup}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Follow-up
            </Button>
            
            {(data.status === 'trial-completed' || data.status === 'awaiting-payment') && (
              <Button
                size="sm"
                onClick={() => onCreatePaymentLink(item)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Payment Link
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Follow-up Modal */}
      <ScheduleFollowupModal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        student={data}
        onSuccess={handleScheduleSuccess}
      />
    </>
  );
};
