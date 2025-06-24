
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  BookOpen, 
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Minus,
  Edit3,
  StickyNote
} from 'lucide-react';
import { format, toZonedTime } from 'date-fns-tz';

const EGYPT_TIMEZONE = 'Africa/Cairo';

interface StudentProgress {
  studentId: string;
  studentName: string;
  uniqueId: string;
  age: number;
  phone: string;
  country: string;
  platform: string;
  parentName?: string;
  notes?: string;
  totalPaidSessions: number;
  completedPaidSessions: number;
  sessionsRemaining: number;
  nextSessionDate?: string;
  nextSessionTime?: string;
  sessionHistory: SessionHistory[];
  totalMinutes: number;
}

interface SessionHistory {
  sessionNumber: number;
  date: string;
  status: string;
  actualMinutes?: number;
  notes?: string;
  completedAt?: string;
  isTrialSession: boolean;
}

interface CompactStudentCardProps {
  student: StudentProgress;
  onEditSession?: (sessionData: any) => void;
}

export const CompactStudentCard: React.FC<CompactStudentCardProps> = ({ 
  student, 
  onEditSession 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  const formatDateTime = (date?: string, time?: string) => {
    if (!date || !time) return 'Not scheduled';
    
    try {
      const utcDateTimeString = `${date}T${time}Z`;
      const utcDateTime = new Date(utcDateTimeString);
      const egyptDateTime = toZonedTime(utcDateTime, EGYPT_TIMEZONE);
      return format(egyptDateTime, 'dd/MM/yyyy \'at\' h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canEditSession = (session: SessionHistory) => {
    return !session.isTrialSession && 
           session.status === 'scheduled' && 
           new Date(session.date) > new Date();
  };

  const progressPercentage = student.totalPaidSessions > 0 
    ? (student.completedPaidSessions / student.totalPaidSessions) * 100 
    : 0;

  // Separate trial and paid sessions for display
  const paidSessions = student.sessionHistory.filter(s => !s.isTrialSession);
  const trialSessions = student.sessionHistory.filter(s => s.isTrialSession);

  return (
    <Card className="dashboard-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{student.studentName}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono text-xs">{student.uniqueId}</span>
                <span>•</span>
                <span>Age: {student.age}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Overview - Fixed to show only paid sessions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Paid Sessions Progress</span>
            <span className="text-sm text-muted-foreground">
              {student.completedPaidSessions}/{student.totalPaidSessions}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-orange-600">{student.sessionsRemaining}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{student.totalMinutes}</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Next Session</p>
              <p className="text-xs font-semibold">
                {formatDateTime(student.nextSessionDate, student.nextSessionTime)}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs">{student.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs">{student.country}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs capitalize">{student.platform}</span>
          </div>
        </div>

        {/* Expandable Session History */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-3 pt-4 border-t">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Session History
            </h4>
            
            {/* Trial Sessions */}
            {trialSessions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Trial Sessions</p>
                {trialSessions.map((session) => (
                  <div key={`trial-${session.sessionNumber}`} className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(session.status)}
                        <div>
                          <p className="text-sm font-medium">Trial Session</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(session.date), 'dd/MM/yyyy')}
                            {session.actualMinutes && ` • ${session.actualMinutes} minutes`}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(session.status)} border-0 text-xs`}>
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paid Sessions */}
            {paidSessions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Paid Sessions</p>
                {paidSessions.map((session) => (
                  <div key={`paid-${session.sessionNumber}`} className="space-y-2">
                    <div className="p-2 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(session.status)}
                          <div>
                            <p className="text-sm font-medium">Session {session.sessionNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(session.date), 'dd/MM/yyyy')}
                              {session.actualMinutes && ` • ${session.actualMinutes} minutes`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.notes && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedSession(
                                expandedSession === session.sessionNumber ? null : session.sessionNumber
                              )}
                            >
                              <StickyNote className="h-3 w-3" />
                            </Button>
                          )}
                          {canEditSession(session) && onEditSession && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditSession(session)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          )}
                          <Badge className={`${getStatusColor(session.status)} border-0 text-xs`}>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Learning Notes Expansion */}
                    {expandedSession === session.sessionNumber && session.notes && (
                      <div className="ml-6 p-3 bg-muted/50 rounded-md border-l-2 border-primary/20">
                        <p className="text-xs font-medium mb-1">Learning Notes:</p>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{session.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {paidSessions.length === 0 && trialSessions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No sessions yet</p>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
