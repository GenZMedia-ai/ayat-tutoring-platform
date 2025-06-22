
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateFilter, DateRange } from '@/components/teacher/DateFilter';
import { useTeacherTrialSessions } from '@/hooks/useTeacherTrialSessions';
import { useWhatsAppContact } from '@/hooks/useWhatsAppContact';
import { TeacherStudentCard } from '@/components/teacher/TeacherStudentCard';
import { RescheduleModal } from '@/components/teacher/RescheduleModal';
import TrialOutcomeModal from '@/components/teacher/TrialOutcomeModal';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { TrialStudent } from '@/hooks/useTeacherTrialSessions';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'trial-completed' | 'trial-ghosted' | 'rescheduled';

const EnhancedTeacherTrials: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [rescheduleStudent, setRescheduleStudent] = useState<TrialStudent | null>(null);
  const [trialOutcomeStudent, setTrialOutcomeStudent] = useState<TrialStudent | null>(null);
  const [trialOutcomeType, setTrialOutcomeType] = useState<'completed' | 'ghosted'>('completed');
  
  const { trialStudents, loading: trialsLoading, confirmTrial, refreshTrialSessions } = useTeacherTrialSessions();
  const { logContact, openWhatsApp } = useWhatsAppContact();

  // Filter students based on status and date
  const filteredStudents = trialStudents.filter(student => {
    const statusMatch = statusFilter === 'all' || student.status === statusFilter;
    // Note: Date filtering would need additional logic based on trial_date
    return statusMatch;
  });

  // Separate students into categories
  const pendingConfirmedStudents = filteredStudents.filter(s => 
    s.status === 'pending' || s.status === 'confirmed'
  );
  
  const completedStudents = filteredStudents.filter(s => 
    s.status === 'trial-completed' || s.status === 'trial-ghosted' || 
    (s.status === 'confirmed' && /* has been rescheduled */ false) // TODO: Add reschedule logic
  );

  const handleContactStudent = async (studentId: string, phone: string) => {
    try {
      openWhatsApp(phone);
      await logContact(studentId, 'trial_confirmation', true, 'WhatsApp contact initiated by teacher');
      await refreshTrialSessions();
    } catch (error) {
      console.error('Error handling contact:', error);
    }
  };

  const handleConfirmTrial = async (studentId: string) => {
    const success = await confirmTrial(studentId);
    if (success) {
      console.log('✅ Trial confirmed successfully for student:', studentId);
    }
  };

  const handleMarkCompleted = (student: TrialStudent) => {
    console.log('🎯 Opening completed trial outcome modal for student:', student.name);
    setTrialOutcomeStudent(student);
    setTrialOutcomeType('completed');
  };

  const handleMarkGhosted = (student: TrialStudent) => {
    console.log('👻 Opening ghosted trial outcome modal for student:', student.name);
    setTrialOutcomeStudent(student);
    setTrialOutcomeType('ghosted');
  };

  const handleTrialOutcomeSuccess = () => {
    console.log('✅ Trial outcome submitted successfully');
    setTrialOutcomeStudent(null);
    refreshTrialSessions();
  };

  const handleReschedule = (student: TrialStudent) => {
    console.log('🔄 Opening reschedule modal for student:', student.name);
    setRescheduleStudent(student);
  };

  const handleRescheduleSuccess = () => {
    console.log('✅ Reschedule completed successfully');
    setRescheduleStudent(null);
    refreshTrialSessions();
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Trial Session Management</h1>
          <p className="text-muted-foreground">Manage trial sessions and confirmations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="trial-completed">Completed</SelectItem>
                <SelectItem value="trial-ghosted">Ghosted</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {trialsLoading ? (
        <Card className="dashboard-card">
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <LoadingSpinner />
              <span className="ml-2 text-muted-foreground">Loading trial sessions...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pending and Confirmed Trials */}
          {pendingConfirmedStudents.length > 0 && (
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Active Trials
                  <Badge variant="outline">{pendingConfirmedStudents.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Pending and confirmed trial sessions requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pendingConfirmedStudents.map((student) => (
                    <TeacherStudentCard
                      key={student.id}
                      student={student}
                      onContact={handleContactStudent}
                      onConfirm={handleConfirmTrial}
                      onMarkCompleted={handleMarkCompleted}
                      onMarkGhosted={handleMarkGhosted}
                      onReschedule={handleReschedule}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed, Ghosted, and Rescheduled Trials */}
          {completedStudents.length > 0 && (
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Trial History
                  <Badge variant="outline">{completedStudents.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Completed, ghosted, and rescheduled trial sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {completedStudents.map((student) => (
                    <TeacherStudentCard
                      key={student.id}
                      student={student}
                      onContact={handleContactStudent}
                      onConfirm={handleConfirmTrial}
                      onMarkCompleted={handleMarkCompleted}
                      onMarkGhosted={handleMarkGhosted}
                      onReschedule={handleReschedule}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results */}
          {filteredStudents.length === 0 && (
            <Card className="dashboard-card">
              <CardContent className="py-8">
                <div className="text-center">
                  <p className="text-muted-foreground text-lg font-medium">No trial sessions found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your filters or check back later
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modals */}
      <RescheduleModal
        student={rescheduleStudent}
        open={!!rescheduleStudent}
        onClose={() => setRescheduleStudent(null)}
        onSuccess={handleRescheduleSuccess}
      />

      <TrialOutcomeModal
        student={trialOutcomeStudent}
        outcome={trialOutcomeType}
        open={!!trialOutcomeStudent}
        onClose={() => setTrialOutcomeStudent(null)}
        onSuccess={handleTrialOutcomeSuccess}
      />
    </div>
  );
};

export default EnhancedTeacherTrials;
