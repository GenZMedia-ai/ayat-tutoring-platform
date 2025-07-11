
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  User, 
  Users, 
  Calendar, 
  CheckCircle, 
  Phone, 
  Video,
  TrendingUp,
  AlertCircle,
  Timer
} from 'lucide-react';
import { format } from 'date-fns';

interface SessionCardProps {
  session: {
    id: string;
    sessionNumber: number;
    scheduledDate: string;
    scheduledTime: string;
    egyptTime: string;
    status: string;
    student: {
      id: string;
      name: string;
      age: number;
      phone: string;
      platform: string;
      packageSessionCount: number;
      isFamily: boolean;
      familyInfo?: {
        parentName: string;
        totalStudents: number;
        familyMembers: string[];
      };
    };
    progress: {
      totalSessions: number;
      completedSessions: number;
      percentage: number;
    };
    priority: 'urgent' | 'today' | 'upcoming' | 'normal';
  };
  onCompleteSession: (session: any) => void;
  onContactStudent: (phone: string, name: string) => void;
}

export const EnhancedSessionCard: React.FC<SessionCardProps> = ({
  session,
  onCompleteSession,
  onContactStudent
}) => {
  const getPriorityConfig = () => {
    switch (session.priority) {
      case 'urgent':
        return {
          badge: 'destructive',
          cardBorder: 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50',
          icon: AlertCircle,
          iconColor: 'text-red-600'
        };
      case 'today':
        return {
          badge: 'default',
          cardBorder: 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50',
          icon: Timer,
          iconColor: 'text-blue-600'
        };
      case 'upcoming':
        return {
          badge: 'secondary',
          cardBorder: 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50',
          icon: Clock,
          iconColor: 'text-yellow-600'
        };
      default:
        return {
          badge: 'outline',
          cardBorder: 'border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50',
          icon: Calendar,
          iconColor: 'text-slate-600'
        };
    }
  };

  const priorityConfig = getPriorityConfig();
  const PriorityIcon = priorityConfig.icon;

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM dd, yyyy');
  };

  const getPlatformIcon = () => {
    return session.student.platform === 'zoom' ? Video : Video;
  };

  const PlatformIcon = getPlatformIcon();

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg ${priorityConfig.cardBorder} border-l-4`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-white shadow-sm`}>
              {session.student.isFamily ? (
                <Users className={`h-5 w-5 ${priorityConfig.iconColor}`} />
              ) : (
                <User className={`h-5 w-5 ${priorityConfig.iconColor}`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-slate-800">
                  {session.student.isFamily 
                    ? session.student.familyInfo?.parentName || 'Family Session'
                    : session.student.name
                  }
                </h3>
                <Badge variant={priorityConfig.badge as any} className="text-xs">
                  <PriorityIcon className="h-3 w-3 mr-1" />
                  {session.priority.charAt(0).toUpperCase() + session.priority.slice(1)}
                </Badge>
              </div>
              
              {session.student.isFamily && (
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">
                    {session.student.familyInfo?.totalStudents} students: {' '}
                    {session.student.familyInfo?.familyMembers.join(', ')}
                  </span>
                </div>
              )}

              {!session.student.isFamily && (
                <p className="text-sm text-slate-600">
                  {session.student.name}, Age {session.student.age}
                </p>
              )}
            </div>
          </div>

          <Badge variant="outline" className="bg-white text-sm">
            Session {session.sessionNumber}/{session.student.packageSessionCount}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Session Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
            <Calendar className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Date</p>
              <p className="font-medium text-slate-800">{formatDate(session.scheduledDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
            <Clock className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Time</p>
              <p className="font-medium text-slate-800">{session.egyptTime}</p>
            </div>
          </div>
        </div>

        {/* Platform & Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlatformIcon className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700 capitalize">
                {session.student.platform}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {session.progress.percentage}% Complete
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Progress</span>
              <span className="text-slate-800 font-medium">
                {session.progress.completedSessions}/{session.progress.totalSessions} sessions
              </span>
            </div>
            <Progress 
              value={session.progress.percentage} 
              className="h-2 bg-slate-100"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onCompleteSession(session)}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Session
          </Button>
          
          <Button
            variant="outline"
            onClick={() => onContactStudent(session.student.phone, session.student.name)}
            className="bg-white hover:bg-slate-50 border-slate-200"
            size="sm"
          >
            <Phone className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
