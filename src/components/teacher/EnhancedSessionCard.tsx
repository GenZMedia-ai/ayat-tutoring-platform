
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Phone, 
  MapPin, 
  User, 
  MessageCircle,
  CheckCircle,
  Users,
  Calendar,
  Monitor
} from 'lucide-react';
import { EnhancedSessionData } from '@/hooks/useEnhancedSessionData';

interface EnhancedSessionCardProps {
  session: EnhancedSessionData;
  onContact: (phone: string, name: string) => void;
  onCompleteSession: (session: EnhancedSessionData) => void;
}

export const EnhancedSessionCard: React.FC<EnhancedSessionCardProps> = ({
  session,
  onContact,
  onCompleteSession
}) => {
  const progressPercentage = (session.sessionNumber / session.totalSessions) * 100;

  const handleWhatsAppContact = () => {
    const contactName = session.parentName || session.studentName;
    onContact(session.phone, contactName);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 bg-gradient-to-br from-background via-background to-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            {/* Student Name and Family Info */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {session.isFamily ? (
                  <Users className="h-4 w-4 text-primary" />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
                <h3 className="font-semibold text-lg text-foreground">
                  {session.studentName}
                </h3>
              </div>
              
              <Badge 
                variant="outline" 
                className="border-primary/20 text-primary bg-primary/5"
              >
                {session.isFamily ? 'Family Student' : 'Individual'}
              </Badge>
            </div>

            {/* Parent Name */}
            {session.parentName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span>Parent: {session.parentName}</span>
              </div>
            )}

            {/* Family ID */}
            {session.familyId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                <span className="font-mono text-xs">Family ID: {session.familyId}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Session Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              This is session {session.sessionNumber} of {session.totalSessions} sessions
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
            style={{
              background: 'hsl(var(--muted))',
            }}
          />
        </div>

        {/* Session Details */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{session.formattedDateTime}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{session.phone}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{session.country}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{session.platform}</span>
          </div>
        </div>

        {/* Package Info */}
        <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
          <div className="text-sm">
            <span className="font-medium text-foreground">Package:</span>
            <span className="ml-2 text-muted-foreground">{session.packageName}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-border/50">
          <Button
            onClick={handleWhatsAppContact}
            variant="outline"
            size="sm"
            className="flex-1 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30"
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            Contact {session.parentName ? 'Parent' : 'Student'}
          </Button>
          
          <Button
            onClick={() => onCompleteSession(session)}
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Complete Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
