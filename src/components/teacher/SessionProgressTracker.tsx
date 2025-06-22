
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSessionProgress } from '@/hooks/useSessionProgress';
import { Clock, TrendingUp, CheckCircle } from 'lucide-react';

interface SessionProgressTrackerProps {
  studentId: string;
  studentName: string;
}

export const SessionProgressTracker: React.FC<SessionProgressTrackerProps> = ({
  studentId,
  studentName
}) => {
  const { progress, loading } = useSessionProgress(studentId);

  if (loading || !progress) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-3 w-3" />;
      case 'expired': return <CheckCircle className="h-3 w-3" />;
      default: return <TrendingUp className="h-3 w-3" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{studentName}</CardTitle>
          <Badge className={getStatusColor(progress.studentStatus)}>
            {getStatusIcon(progress.studentStatus)}
            <span className="ml-1 capitalize">{progress.studentStatus}</span>
          </Badge>
        </div>
        <CardDescription>
          Session Progress: {progress.completedSessions} of {progress.totalSessions} completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{progress.completionPercentage}%</span>
          </div>
          <Progress value={progress.completionPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress.completedSessions} completed</span>
            <span>{progress.totalSessions - progress.completedSessions} remaining</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
