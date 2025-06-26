import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeacherActiveStudents } from '@/hooks/useTeacherActiveStudents';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { CompactStudentCard } from '@/components/teacher/CompactStudentCard';
import { SessionEditModal } from '@/components/teacher/SessionEditModal';
import { StudentProfileModal } from '@/components/shared/StudentProfileModal';

interface EditingSession {
  sessionData: any;
  studentName: string;
  studentId: string;
}

const EnhancedTeacherStudents: React.FC = () => {
  const { students, loading, refreshStudents } = useTeacherActiveStudents();
  const [editingSession, setEditingSession] = useState<EditingSession | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const handleEditSession = (sessionData: any, studentName: string, studentId: string) => {
    console.log('Edit session:', sessionData);
    setEditingSession({
      sessionData,
      studentName,
      studentId
    });
  };

  const handleEditSuccess = () => {
    setEditingSession(null);
    refreshStudents();
  };

  if (loading) {
    return (
      <Card className="dashboard-card">
        <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
          <CardTitle>{t('students.title')}</CardTitle>
          <CardDescription>{t('students.viewAndManage')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center justify-center py-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <LoadingSpinner />
            <span className={`text-muted-foreground ${isRTL ? 'mr-2' : 'ml-2'}`}>
              {t('students.loadingStudents')}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <div className={isRTL ? 'text-right' : 'text-left'}>
        <h1 className="text-2xl font-bold text-primary">{t('students.title')}</h1>
        <p className="text-muted-foreground">{t('students.subtitle')}</p>
      </div>

      {students.length === 0 ? (
        <Card className="dashboard-card">
          <CardContent className="py-8">
            <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-muted-foreground text-lg font-medium">{t('students.noActiveStudents')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('students.studentsWillAppear')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {students.map((student) => (
            <div key={student.studentId} onClick={() => setSelectedStudent(student)}>
              <CompactStudentCard
                student={student}
                onEditSession={(sessionData) => 
                  handleEditSession(sessionData, student.studentName, student.studentId)
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Student Profile Modal */}
      {selectedStudent && (
        <StudentProfileModal
          student={{
            id: selectedStudent.studentId,
            name: selectedStudent.studentName,
            uniqueId: selectedStudent.uniqueId,
            age: selectedStudent.age,
            phone: selectedStudent.phone,
            country: selectedStudent.country,
            platform: selectedStudent.platform,
            status: 'active', // Active students
            createdAt: new Date().toISOString(),
            trialDate: null,
            trialTime: null,
            teacherType: 'mixed'
          }}
          open={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {editingSession && (
        <SessionEditModal
          session={editingSession.sessionData}
          studentName={editingSession.studentName}
          studentId={editingSession.studentId}
          open={!!editingSession}
          onClose={() => setEditingSession(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default EnhancedTeacherStudents;
