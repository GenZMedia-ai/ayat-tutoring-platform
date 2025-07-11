
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EnhancedSessionData } from '@/hooks/useTeacherSessionsEnhanced';
import { 
  Clock, 
  CheckCircle, 
  Phone, 
  Users, 
  User, 
  Calendar,
  Star,
  Target,
  MessageCircle
} from 'lucide-react';

interface EnhancedSessionCardProps {
  session: EnhancedSessionData;
  onCompleteSession: (session: EnhancedSessionData) => void;
  onContactParent: (phone: string, name: string) => void;
}

export const EnhancedSessionCard: React.FC<EnhancedSessionCardProps> = ({
  session,
  onCompleteSession,
  onContactParent
}) => {
  const getPriorityStyles = () => {
    switch (session.priority) {
      case 'today':
        return {
          cardClass: 'border-red-200 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
          badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
          iconColor: 'text-red-600'
        };
      case 'upcoming':
        return {
          cardClass: 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
          iconColor: 'text-amber-600'
        };
      default:
        return {
          cardClass: 'border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5',
          badgeClass: 'bg-primary/10 text-primary dark:bg-primary/20',
          iconColor: 'text-primary'
        };
    }
  };

  const { cardClass, badgeClass, iconColor } = getPriorityStyles();
  const progressPercentage = Math.round((session.completedSessions / session.totalSessions) * 100);

  const handleContact = () => {
    const phone = session.familyInfo?.parentPhone || '';
    const name = session.familyInfo?.parentName || session.studentName;
    onContactParent(phone, name);
  };

  return (
    <Card className={`${cardClass} shadow-lg hover:shadow-xl transition-all duration-300 border`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {session.isFamily ? (
              <div className="p-2 bg-white/80 rounded-xl shadow-sm">
                <Users className={`h-5 w-5 ${iconColor}`} />
              </div>
            ) : (
              <div className="p-2 bg-white/80 rounded-xl shadow-sm">
                <User className={`h-5 w-5 ${iconColor}`} />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {session.studentName}
                </h3>
                {session.isFamily && (
                  <Badge variant="outline" className="text-xs">
                    Family ({session.familyInfo?.totalChildren} students)
                  </Badge>
                )}
              </div>
              
              {session.isFamily && session.familyInfo && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Parent: {session.familyInfo.parentName}
                </p>
              )}
            </div>
          </div>

          <Badge className={`${badgeClass} font-medium`}>
            {session.priority === 'today' ? 'Today' : 
             session.priority === 'upcoming' ? 'This Week' : 'Scheduled'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Session Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Clock className={`h-4 w-4 ${iconColor}`} />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {session.displayTime}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(session.scheduledDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Target className={`h-4 w-4 ${iconColor}`} />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Session {session.sessionNumber}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                of {session.totalSessions} total
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {session.completedSessions}/{session.totalSessions} ({progressPercentage}%)
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-gray-200 dark:bg-gray-700"
          />
        </div>

        {/* Package & Platform Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {session.platform}
              </span>
            </div>
            {session.packageName && (
              <div className="text-gray-600 dark:text-gray-400">
                {session.packageName}
              </div>
            )}
          </div>
          
          {session.paymentAmount && (
            <div className="text-sm font-medium text-green-600 dark:text-green-400">
              {session.paymentAmount} {session.currency}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onCompleteSession(session)}
            className="flex-1 bg-primary hover:bg-primary/90 text-white"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Session
          </Button>
          
          {(session.familyInfo?.parentPhone) && (
            <Button
              onClick={handleContact}
              variant="outline"
              size="sm"
              className="border-primary/20 hover:bg-primary/5"
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="border-primary/20 hover:bg-primary/5"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
