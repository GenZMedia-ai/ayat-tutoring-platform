
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, MessageCircle, User } from 'lucide-react';
import { useTodayPaidSessions } from '@/hooks/useTodayPaidSessions';
import { useAuth } from '@/contexts/AuthContext';
import { SessionCompletionModal } from './SessionCompletionModal';
import { WhatsAppContactButton } from './WhatsAppContactButton';

export const TodayPaidSessions: React.FC = () => {
  const { user } = useAuth();
  const { data: sessions = [], isLoading } = useTodayPaidSessions(user?.id);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading today's sessions...</div>;
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Paid Sessions
          </CardTitle>
          <CardDescription>
            Active student sessions scheduled for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No paid sessions scheduled for today.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Today's Paid Sessions
        </h3>
        <Badge variant="outline">{sessions.length} sessions</Badge>
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => {
          const progressPercentage = (session.completed_sessions / session.package_session_count) * 100;
          
          return (
            <Card key={session.session_id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{session.student_name}</CardTitle>
                    <CardDescription>
                      {session.student_unique_id} • Session {session.session_number} • {session.scheduled_time}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-blue-600">Active</Badge>
                    <Badge variant="outline">{session.platform}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Package Progress</span>
                    <span className="text-muted-foreground">
                      {session.completed_sessions} of {session.package_session_count} completed
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Phone:</span> {session.phone}
                  </div>
                  <div>
                    <span className="font-medium">Session:</span> #{session.session_number}
                  </div>
                  {session.parent_name && (
                    <div className="md:col-span-2">
                      <span className="font-medium">Parent:</span> {session.parent_name}
                    </div>
                  )}
                </div>

                {session.notes && (
                  <div className="p-3 bg-muted rounded-md">
                    <span className="font-medium text-sm">Notes:</span>
                    <p className="text-sm mt-1">{session.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <WhatsAppContactButton
                    studentId={session.student_id}
                    phone={session.phone}
                    studentName={session.student_name}
                    contactType="session_reminder"
                    customMessage={`Hi ${session.student_name}! Reminder about your session today at ${session.scheduled_time}. Looking forward to our lesson!`}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact
                  </WhatsAppContactButton>
                  
                  <Button
                    size="sm"
                    onClick={() => setSelectedSession(session)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedSession && (
        <SessionCompletionModal
          session={selectedSession}
          open={!!selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
};
