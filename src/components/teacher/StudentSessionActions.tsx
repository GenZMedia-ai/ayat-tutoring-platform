import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Calendar,
  Clock,
  FileText,
  MoreVertical,
  PlayCircle
} from 'lucide-react';
import { StudentProgress } from '@/hooks/useTeacherActiveStudents';

interface StudentSessionActionsProps {
  student: StudentProgress;
  onEditSession?: (sessionData: any, studentName: string, studentId: string) => void;
  onViewHistory?: (studentId: string) => void;
}

export const StudentSessionActions: React.FC<StudentSessionActionsProps> = ({
  student,
  onEditSession,
  onViewHistory
}) => {
  const hasNextSession = student.nextSessionDate && student.nextSessionTime;
  const nextSessionData = hasNextSession ? {
    date: student.nextSessionDate,
    time: student.nextSessionTime,
    studentName: student.studentName,
    studentId: student.studentId
  } : null;

  const handleReschedule = () => {
    if (onEditSession && nextSessionData) {
      onEditSession(nextSessionData, student.studentName, student.studentId);
    }
  };

  const handleViewHistory = () => {
    if (onViewHistory) {
      onViewHistory(student.studentId);
    }
  };

  // If no next session, show simplified view
  if (!hasNextSession) {
    return (
      <div className="flex items-center gap-1">
        <div className="text-xs text-muted-foreground">Session history available</div>
        <span className="text-xs text-muted-foreground">No upcoming session</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {/* Next Session Info */}
      <div className="text-right mr-2">
        <div className="text-xs font-medium text-primary">
          {new Date(student.nextSessionDate!).toLocaleDateString()}
        </div>
        <div className="text-xs text-muted-foreground">
          {student.nextSessionTime}
        </div>
      </div>

      {/* Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/30 text-primary hover:bg-primary/5"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleReschedule} className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Reschedule Session
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};