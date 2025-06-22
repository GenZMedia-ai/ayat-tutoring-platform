
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, BookOpen } from 'lucide-react';
import { useTodayPaidSessions } from '@/hooks/useTodayPaidSessions';
import { TodayPaidSessionCard } from './TodayPaidSessionCard';

export const TodayPaidSessionsSection: React.FC = () => {
  const { todaySessions, loading, error, fetchTodaySessions, completeSession } = useTodayPaidSessions();

  const scheduledCount = todaySessions.filter(s => s.status === 'scheduled').length;
  const completedCount = todaySessions.filter(s => s.status === 'completed').length;

  if (loading) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Today's Paid Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading today's sessions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Today's Paid Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={fetchTodaySessions} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Today's Paid Sessions
            </CardTitle>
            <CardDescription>
              Active student sessions scheduled for today
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-blue-600">
              {scheduledCount} Scheduled
            </Badge>
            <Badge variant="outline" className="text-green-600">
              {completedCount} Completed
            </Badge>
            <Button onClick={fetchTodaySessions} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {todaySessions.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No Sessions Today
            </h3>
            <p className="text-sm text-muted-foreground">
              You don't have any paid student sessions scheduled for today
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {todaySessions.map((session) => (
              <TodayPaidSessionCard
                key={session.session_id}
                session={session}
                onComplete={completeSession}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
