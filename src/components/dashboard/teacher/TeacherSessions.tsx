
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TeacherSessions: React.FC = () => {
  // Mock data for today's sessions
  const todaySessions = [
    { id: '1', studentName: 'Omar Ali', time: '16:00', sessionNumber: 3, totalSessions: 8 },
    { id: '2', studentName: 'Layla Hassan', time: '18:30', sessionNumber: 5, totalSessions: 16 },
    { id: '3', studentName: 'Youssef Ahmed', time: '20:00', sessionNumber: 1, totalSessions: 8 }
  ];

  const handleCompleteSession = (sessionId: string) => {
    console.log('Session completed:', sessionId);
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Paid Session Management</CardTitle>
        <CardDescription>
          Track and complete paid learning sessions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {todaySessions.map((session) => (
            <div key={session.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h4 className="font-medium">{session.studentName}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Session:</span> {session.sessionNumber} of {session.totalSessions}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time:</span> {session.time}
                    </div>
                  </div>
                  <Badge className="status-active">Scheduled</Badge>
                </div>
                <Button 
                  size="sm"
                  className="ayat-button-primary"
                  onClick={() => handleCompleteSession(session.id)}
                >
                  Mark Complete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherSessions;
