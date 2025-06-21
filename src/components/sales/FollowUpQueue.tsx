
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, MessageCircle, CreditCard, Calendar, Phone } from 'lucide-react';
import { TrialSessionFlowStudent } from '@/types/trial';
import { formatDistanceToNow } from 'date-fns';

interface FollowUpQueueProps {
  students: TrialSessionFlowStudent[];
  onCreatePaymentLink: (studentId: string) => void;
  onScheduleFollowUp: (studentId: string) => void;
  onWhatsAppContact: (studentId: string) => void;
}

const FollowUpQueue: React.FC<FollowUpQueueProps> = ({
  students,
  onCreatePaymentLink,
  onScheduleFollowUp,
  onWhatsAppContact
}) => {
  const [selectedStudent, setSelectedStudent] = useState<TrialSessionFlowStudent | null>(null);

  const getUrgencyLevel = (student: TrialSessionFlowStudent) => {
    if (!student.trialOutcome?.submittedAt) return 'medium';
    
    const submittedTime = new Date(student.trialOutcome.submittedAt);
    const now = new Date();
    const hoursElapsed = (now.getTime() - submittedTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursElapsed < 0.25) return 'hot';     // <15 minutes
    if (hoursElapsed < 1) return 'warm';       // 15min-1hr
    if (hoursElapsed < 5) return 'cooling';    // 1-5hrs
    return 'cold';                             // >5hrs
  };

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case 'hot':
        return { icon: '🟢', label: 'Hot Lead', color: 'bg-green-100 text-green-800', description: '<15 minutes' };
      case 'warm':
        return { icon: '🟡', label: 'Warm Lead', color: 'bg-yellow-100 text-yellow-800', description: '15min-1hr' };
      case 'cooling':
        return { icon: '🟠', label: 'Cooling Lead', color: 'bg-orange-100 text-orange-800', description: '1-5hrs' };
      case 'cold':
        return { icon: '🔴', label: 'Cold Lead', color: 'bg-red-100 text-red-800', description: '>5hrs' };
      default:
        return { icon: '⚪', label: 'Unknown', color: 'bg-gray-100 text-gray-800', description: '' };
    }
  };

  const completedTrialStudents = students.filter(s => 
    s.trialOutcome?.outcome === 'completed' && !s.paymentLink
  );

  const sortedStudents = completedTrialStudents.sort((a, b) => {
    const urgencyOrder = { hot: 0, warm: 1, cooling: 2, cold: 3 };
    const aUrgency = getUrgencyLevel(a);
    const bUrgency = getUrgencyLevel(b);
    return urgencyOrder[aUrgency] - urgencyOrder[bUrgency];
  });

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Follow-up Queue ({sortedStudents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedStudents.map((student) => {
            const urgency = getUrgencyLevel(student);
            const urgencyConfig = getUrgencyConfig(urgency);
            const timeElapsed = student.trialOutcome?.submittedAt 
              ? formatDistanceToNow(new Date(student.trialOutcome.submittedAt), { addSuffix: true })
              : 'Unknown';

            return (
              <div key={student.id} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{student.name}</h4>
                      <span className="text-xs text-muted-foreground">({student.uniqueId})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={urgencyConfig.color}>
                        {urgencyConfig.icon} {urgencyConfig.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Trial completed {timeElapsed}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Age: {student.age} • Country: {student.country}
                    </div>
                    {student.trialOutcome?.recommendedPackage && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Recommended:</span>{' '}
                        <span className="font-medium">{student.trialOutcome.recommendedPackage}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onWhatsAppContact(student.id)}
                    className="gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    className="ayat-button-primary gap-1"
                    onClick={() => onCreatePaymentLink(student.id)}
                  >
                    <CreditCard className="w-3 h-3" />
                    Payment Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onScheduleFollowUp(student.id)}
                    className="gap-1"
                  >
                    <Calendar className="w-3 h-3" />
                    Schedule
                  </Button>
                </div>

                {student.trialOutcome?.teacherNotes && (
                  <div className="text-sm bg-gray-50 p-2 rounded">
                    <strong>Teacher Notes:</strong> {student.trialOutcome.teacherNotes}
                  </div>
                )}
              </div>
            );
          })}
          
          {sortedStudents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No completed trials requiring follow-up
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FollowUpQueue;
