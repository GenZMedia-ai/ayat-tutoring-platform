
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, CreditCard, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useMixedStudentData } from '@/hooks/useMixedStudentData';
import { useStudentFollowUp, FollowUpData } from '@/hooks/useStudentFollowUp';
import { ScheduleFollowUpModal } from './ScheduleFollowUpModal';
import { CompleteFollowUpModal } from './CompleteFollowUpModal';
import { PaymentLinkModal } from './PaymentLinkModal';
import { TrialSessionFlowStudent } from '@/types/trial';
import { FamilyGroup } from '@/types/family';
import { formatInEgyptTime } from '@/utils/egyptTimezone';
import { format, isPast } from 'date-fns';

export const FollowUpManagementTab: React.FC = () => {
  const { items, loading, refetchData } = useMixedStudentData();
  const { getFollowUpData } = useStudentFollowUp();
  const [selectedStudentForScheduling, setSelectedStudentForScheduling] = useState<TrialSessionFlowStudent | FamilyGroup | null>(null);
  const [selectedStudentForCompletion, setSelectedStudentForCompletion] = useState<{student: TrialSessionFlowStudent | FamilyGroup, followUp: FollowUpData} | null>(null);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<TrialSessionFlowStudent | FamilyGroup | null>(null);
  const [followUpDataMap, setFollowUpDataMap] = useState<Map<string, FollowUpData>>(new Map());

  // Filter students that need follow-up or are in follow-up status
  const trialCompletedStudents = items.filter(item => {
    const status = item.type === 'individual' 
      ? (item.data as TrialSessionFlowStudent).status 
      : (item.data as FamilyGroup).status;
    return status === 'trial-completed';
  });

  const followUpStudents = items.filter(item => {
    const status = item.type === 'individual' 
      ? (item.data as TrialSessionFlowStudent).status 
      : (item.data as FamilyGroup).status;
    return status === 'follow-up';
  });

  // Load follow-up data for students in follow-up status
  useEffect(() => {
    const loadFollowUpData = async () => {
      const newFollowUpDataMap = new Map<string, FollowUpData>();
      
      for (const item of followUpStudents) {
        const followUpData = await getFollowUpData(item.data.id);
        if (followUpData) {
          newFollowUpDataMap.set(item.data.id, followUpData);
        }
      }
      
      setFollowUpDataMap(newFollowUpDataMap);
    };

    if (followUpStudents.length > 0) {
      loadFollowUpData();
    }
  }, [followUpStudents.length]);

  const handleWhatsAppContact = (item: any) => {
    const data = item.data;
    const phone = data.phone.replace(/[^0-9]/g, '');
    const name = item.type === 'individual' 
      ? (data as TrialSessionFlowStudent).name 
      : (data as FamilyGroup).parent_name;
    
    const message = `Hello ${name}! I hope you're doing well. I wanted to follow up regarding your trial session and discuss our learning packages. When would be a good time to talk?`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleScheduleFollowUp = (item: any) => {
    setSelectedStudentForScheduling(item.data);
  };

  const handleCompleteFollowUp = (item: any) => {
    const followUpData = followUpDataMap.get(item.data.id);
    if (followUpData) {
      setSelectedStudentForCompletion({ student: item.data, followUp: followUpData });
    }
  };

  const handleCreatePaymentLink = (item: any) => {
    setSelectedStudentForPayment(item.data);
  };

  const getName = (item: any) => {
    return item.type === 'individual' 
      ? (item.data as TrialSessionFlowStudent).name 
      : (item.data as FamilyGroup).parent_name;
  };

  const getUniqueId = (item: any) => {
    return item.type === 'individual' 
      ? (item.data as TrialSessionFlowStudent).uniqueId 
      : (item.data as FamilyGroup).unique_id;
  };

  const getStudentCount = (item: any) => {
    return item.type === 'family' 
      ? (item.data as FamilyGroup).student_count 
      : 1;
  };

  const renderFollowUpInfo = (item: any) => {
    const followUpData = followUpDataMap.get(item.data.id);
    if (!followUpData) return null;

    const scheduledDate = new Date(followUpData.scheduledDate);
    const isOverdue = isPast(scheduledDate);
    const egyptTime = formatInEgyptTime(followUpData.scheduledDate, "dd/MM/yyyy 'at' h:mm a");

    return (
      <div className={`p-3 rounded-lg border ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4" />
          <span className="font-medium text-sm">
            Scheduled: {egyptTime}
          </span>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>
        <div className="text-sm">
          <span className="font-medium">Reason:</span> {followUpData.reason.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </div>
        {followUpData.notes && (
          <div className="text-sm mt-1">
            <span className="font-medium">Notes:</span> {followUpData.notes}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading follow-up data...</div>;
  }

  const totalRequiringFollowUp = trialCompletedStudents.length + followUpStudents.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Follow-up Management</h3>
          <p className="text-sm text-muted-foreground">
            Students who completed trials and need follow-up for payment decisions
          </p>
        </div>
        <Badge variant="outline">
          {totalRequiringFollowUp} requiring attention
        </Badge>
      </div>

      {/* Trial Completed Section */}
      {trialCompletedStudents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">New Trial Completions</h4>
            <Badge className="bg-green-100 text-green-800">
              {trialCompletedStudents.length} ready for follow-up
            </Badge>
          </div>
          
          <div className="grid gap-4">
            {trialCompletedStudents.map((item) => {
              const data = item.data;
              return (
                <Card key={item.id} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{getName(item)}</CardTitle>
                        <CardDescription>
                          {getUniqueId(item)} 
                          {item.type === 'family' && ` • ${getStudentCount(item)} students`}
                          {` • ${data.country}`}
                        </CardDescription>
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        Trial Completed
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Phone:</span> {data.phone}</div>
                      <div><span className="font-medium">Platform:</span> {data.platform}</div>
                    </div>
                    
                    {data.notes && (
                      <div className="p-3 bg-muted rounded-md">
                        <span className="font-medium text-sm">Notes:</span>
                        <p className="text-sm mt-1">{data.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWhatsAppContact(item)}
                        className="flex-1"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleScheduleFollowUp(item)}
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Schedule Follow-up
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleCreatePaymentLink(item)}
                        className="flex-1"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Payment Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Scheduled Follow-ups Section */}
      {followUpStudents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">Scheduled Follow-ups</h4>
            <Badge className="bg-orange-100 text-orange-800">
              {followUpStudents.length} pending
            </Badge>
          </div>
          
          <div className="grid gap-4">
            {followUpStudents.map((item) => {
              const data = item.data;
              return (
                <Card key={item.id} className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{getName(item)}</CardTitle>
                        <CardDescription>
                          {getUniqueId(item)} 
                          {item.type === 'family' && ` • ${getStudentCount(item)} students`}
                          {` • ${data.country}`}
                        </CardDescription>
                      </div>
                      <Badge variant="default" className="bg-orange-600">
                        Follow-up Scheduled
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Phone:</span> {data.phone}</div>
                      <div><span className="font-medium">Platform:</span> {data.platform}</div>
                    </div>
                    
                    {renderFollowUpInfo(item)}

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWhatsAppContact(item)}
                        className="flex-1"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Now
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleCompleteFollowUp(item)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Complete Follow-up
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScheduleFollowUp(item)}
                        className="flex-1"
                      >
                        Reschedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalRequiringFollowUp === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No students requiring follow-up at this time.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Students who complete trials will appear here for follow-up management.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {selectedStudentForScheduling && (
        <ScheduleFollowUpModal
          student={selectedStudentForScheduling}
          open={!!selectedStudentForScheduling}
          onClose={() => setSelectedStudentForScheduling(null)}
          onSuccess={() => {
            setSelectedStudentForScheduling(null);
            refetchData();
          }}
        />
      )}

      {selectedStudentForCompletion && (
        <CompleteFollowUpModal
          student={selectedStudentForCompletion.student}
          followUpData={selectedStudentForCompletion.followUp}
          open={!!selectedStudentForCompletion}
          onClose={() => setSelectedStudentForCompletion(null)}
          onSuccess={() => {
            setSelectedStudentForCompletion(null);
            refetchData();
          }}
        />
      )}

      {selectedStudentForPayment && (
        <PaymentLinkModal
          student={selectedStudentForPayment}
          open={!!selectedStudentForPayment}
          onClose={() => setSelectedStudentForPayment(null)}
          onSuccess={() => {
            setSelectedStudentForPayment(null);
            refetchData();
          }}
        />
      )}
    </div>
  );
};
