
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Video, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

interface SessionItem {
  id: string;
  studentName: string;
  time: string;
  platform: 'zoom' | 'google-meet';
  sessionNumber: number;
  totalSessions: number;
  status: 'upcoming' | 'in-progress' | 'completed';
  type: 'trial' | 'paid';
}

interface TodayScheduleTimelineProps {
  sessions: SessionItem[];
  onJoinSession: (sessionId: string) => void;
  onCompleteSession: (sessionId: string) => void;
}

const TodayScheduleTimeline: React.FC<TodayScheduleTimelineProps> = ({
  sessions,
  onJoinSession,
  onCompleteSession
}) => {
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      const session = sessions.find(s => s.time === timeSlot);
      slots.push({ time: timeSlot, session });
    }
    return slots;
  };

  const getPlatformIcon = (platform: 'zoom' | 'google-meet') => {
    return platform === 'zoom' ? '🎥' : '📱';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const timeSlots = generateTimeSlots();
  const currentHour = new Date().getHours();

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Today's Schedule Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {timeSlots.map(({ time, session }) => {
            const hour = parseInt(time.split(':')[0]);
            const isCurrentHour = hour === currentHour;
            
            return (
              <div 
                key={time} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isCurrentHour ? 'bg-primary/10 border-primary' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium w-12 ${
                    isCurrentHour ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {time}
                  </span>
                  {session ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPlatformIcon(session.platform)}</span>
                      <div>
                        <p className="font-medium">{session.studentName}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {session.type === 'trial' ? 'Trial Session' : `Session ${session.sessionNumber}/${session.totalSessions}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Free time</span>
                  )}
                </div>
                {session && (
                  <div className="flex gap-2">
                    {session.status === 'upcoming' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onJoinSession(session.id)}
                        className="gap-1"
                      >
                        <Video className="w-3 h-3" />
                        Join
                      </Button>
                    )}
                    {session.status === 'in-progress' && (
                      <Button
                        size="sm"
                        className="ayat-button-primary gap-1"
                        onClick={() => onCompleteSession(session.id)}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayScheduleTimeline;
