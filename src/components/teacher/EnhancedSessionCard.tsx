
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useWhatsAppContact } from '@/hooks/useWhatsAppContact';
import { Clock, User, Calendar, CheckCircle, MessageCircle, ChevronDown, AlertCircle, Users } from 'lucide-react';

interface SessionCardProps {
  session: {
    id: string;
    studentId: string;
    studentName: string;
    sessionNumber: number;
    scheduledDate: string;
    scheduledTime: string;
    status: string;
    totalSessions: number;
    completedSessions: number;
    priority?: 'high' | 'medium' | 'low';
    isConsecutive?: boolean;
    sequencePosition?: number;
  };
  onCompleteSession: (session: any) => void;
  isRTL?: boolean;
}

export const EnhancedSessionCard: React.FC<SessionCardProps> = ({
  session,
  onCompleteSession,
  isRTL = false
}) => {
  const [isPreparationOpen, setIsPreparationOpen] = useState(false);
  const { openWhatsApp } = useWhatsAppContact();

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low': return 'bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      default: return 'bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-3 w-3 text-red-600" />;
      case 'medium': return <Clock className="h-3 w-3 text-yellow-600" />;
      default: return <CheckCircle className="h-3 w-3 text-green-600" />;
    }
  };

  const handleContactStudent = () => {
    // This would need student phone number from the parent component
    // For now, we'll just show a placeholder
    console.log('Contact student:', session.studentName);
  };

  return (
    <Card className={`${getPriorityColor(session.priority)} transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-4">
        <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="space-y-2 flex-1">
            {/* Header with student name and priority */}
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <User className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">{session.studentName}</h4>
              {session.priority && (
                <Badge variant="outline" className="text-xs">
                  {getPriorityIcon(session.priority)}
                  <span className={isRTL ? 'mr-1' : 'ml-1'}>{session.priority}</span>
                </Badge>
              )}
              {session.isConsecutive && (
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3" />
                  <span className={isRTL ? 'mr-1' : 'ml-1'}>
                    {session.sequencePosition}/{session.totalSessions}
                  </span>
                </Badge>
              )}
            </div>

            {/* Session details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>Session {session.sessionNumber}/{session.totalSessions}</span>
              </div>
              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>{session.scheduledTime}</span>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(session.completedSessions / session.totalSessions) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-muted-foreground">
              Progress: {session.completedSessions}/{session.totalSessions} sessions completed
            </div>

            {/* Pre-session preparation (collapsible) */}
            <Collapsible open={isPreparationOpen} onOpenChange={setIsPreparationOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 p-2 text-xs">
                  <ChevronDown className={`h-3 w-3 transition-transform ${isPreparationOpen ? 'rotate-180' : ''}`} />
                  <span className={isRTL ? 'mr-1' : 'ml-1'}>Session Prep</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="text-xs bg-muted/50 p-2 rounded">
                  <strong>Quick Prep:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Review previous session notes</li>
                    <li>Prepare materials for session {session.sessionNumber}</li>
                    {session.sessionNumber === 1 && <li>First session - focus on introduction</li>}
                    {session.priority === 'high' && <li>High priority - extra attention needed</li>}
                  </ul>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleContactStudent}
                  className={`text-xs ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <MessageCircle className="h-3 w-3" />
                  <span className={isRTL ? 'mr-1' : 'ml-1'}>Contact Student</span>
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>
          
          {/* Main action button */}
          <Button 
            size="sm"
            className={`ayat-button-primary flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}
            onClick={() => onCompleteSession(session)}
          >
            <CheckCircle className="h-3 w-3" />
            Complete Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
