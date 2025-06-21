
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherTrialSessions, TrialStudent } from '@/hooks/useTeacherTrialSessions';
import { useStudentStatusManagement } from '@/hooks/useStudentStatusManagement';
import { useWhatsAppContact } from '@/hooks/useWhatsAppContact';
import { TeacherStudentCard } from '@/components/teacher/TeacherStudentCard';
import { RescheduleModal } from '@/components/teacher/RescheduleModal';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { trialStudents, loading, confirmTrial, refreshTrialSessions } = useTeacherTrialSessions();
  const { updateStudentStatus, rescheduleStudent } = useStudentStatusManagement();
  const { logContact, openWhatsApp } = useWhatsAppContact();
  const [selectedStudent, setSelectedStudent] = useState<TrialStudent | null>(null);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  const handleContact = async (studentId: string, phone: string) => {
    // Open WhatsApp and log the contact attempt
    openWhatsApp(phone);
    const success = await logContact(studentId, 'trial_confirmation', true);
    if (success) {
      refreshTrialSessions();
    }
  };

  const handleConfirm = async (studentId: string) => {
    const success = await confirmTrial(studentId);
    if (success) {
      refreshTrialSessions();
    }
  };

  const handleStatusChange = async (studentId: string, newStatus: string) => {
    const success = await updateStudentStatus(studentId, newStatus);
    if (success) {
      refreshTrialSessions();
    }
  };

  const handleReschedule = (student: TrialStudent) => {
    setSelectedStudent(student);
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleSuccess = () => {
    setIsRescheduleModalOpen(false);
    setSelectedStudent(null);
    refreshTrialSessions();
  };

  const handleTrialOutcomeSubmitted = () => {
    // Refresh the trial sessions to reflect the status change
    refreshTrialSessions();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Not authenticated.</div>;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader />
      
      <div className="grid gap-6">
        {trialStudents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Trial Sessions</h3>
              <p className="text-muted-foreground">
                You don't have any trial sessions scheduled at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          trialStudents.map((student) => (
            <TeacherStudentCard
              key={student.id}
              student={student}
              onContact={handleContact}
              onConfirm={handleConfirm}
              onStatusChange={handleStatusChange}
              onReschedule={handleReschedule}
              onTrialOutcomeSubmitted={handleTrialOutcomeSubmitted}
            />
          ))
        )}
      </div>

      {/* Reschedule Modal */}
      {selectedStudent && (
        <RescheduleModal
          student={selectedStudent}
          open={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          onSuccess={handleRescheduleSuccess}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
