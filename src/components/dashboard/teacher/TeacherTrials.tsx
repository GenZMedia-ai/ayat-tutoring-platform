
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeacherTrialSessions } from '@/hooks/useTeacherTrialSessions';
import { useWhatsAppContact } from '@/hooks/useWhatsAppContact';
import { TeacherStudentCard } from '@/components/teacher/TeacherStudentCard';
import { RescheduleModal } from '@/components/teacher/RescheduleModal';
import TrialOutcomeModal from '@/components/teacher/TrialOutcomeModal';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { TrialStudent } from '@/hooks/useTeacherTrialSessions';

const TeacherTrials: React.FC = () => {
  const [rescheduleStudent, setRescheduleStudent] = useState<TrialStudent | null>(null);
  const [trialOutcomeStudent, setTrialOutcomeStudent] = useState<TrialStudent | null>(null);
  const [trialOutcomeType, setTrialOutcomeType] = useState<'completed' | 'ghosted'>('completed');
  
  const { trialStudents, loading: trialsLoading, confirmTrial, refreshTrialSessions } = useTeacherTrialSessions();
  const { logContact, openWhatsApp } = useWhatsAppContact();

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
    <div className="space-y-4">
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Trial Session Management</CardTitle>
          <CardDescription>
            Manage trial sessions and confirmations. Use the dropdown menu to mark trials as completed or ghosted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trialsLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-muted-foreground">Loading trial sessions...</span>
            </div>
          ) : (
            <>
              {trialStudents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No trial sessions found</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {trialStudents.map((student) => (
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
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Reschedule Modal */}
      <RescheduleModal
        student={rescheduleStudent}
        open={!!rescheduleStudent}
        onClose={() => setRescheduleStudent(null)}
        onSuccess={handleRescheduleSuccess}
      />

      {/* Trial Outcome Modal */}
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

export default TeacherTrials;
