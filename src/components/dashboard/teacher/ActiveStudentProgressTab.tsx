
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionProgressTracker } from '@/components/teacher/SessionProgressTracker';
import { useTeacherActiveStudents } from '@/hooks/useTeacherActiveStudents';
import { CheckCircle } from 'lucide-react';

export const ActiveStudentProgressTab: React.FC = () => {
  const { students: activeStudents, loading: studentsLoading } = useTeacherActiveStudents();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <CheckCircle className="h-5 w-5 text-green-600" />
          {t('sessionManagement.activeStudentProgress')}
        </CardTitle>
        <CardDescription className={isRTL ? 'text-right' : 'text-left'}>
          {t('sessionManagement.trackProgress')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {studentsLoading ? (
          <div className={`flex items-center justify-center py-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className={`text-muted-foreground ${isRTL ? 'mr-2' : 'ml-2'}`}>
              {t('sessionManagement.loadingStudents')}
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {activeStudents.map((item) => {
              // Handle both individual students and family groups
              if ('studentId' in item) {
                // Individual student
                return (
                  <SessionProgressTracker
                    key={item.studentId}
                    studentId={item.studentId}
                    studentName={item.studentName}
                  />
                );
              } else {
                // Family group - render for each student in the family
                return item.students.map((student) => (
                  <SessionProgressTracker
                    key={student.studentId}
                    studentId={student.studentId}
                    studentName={student.studentName}
                  />
                ));
              }
            })}
            
            {activeStudents.length === 0 && !studentsLoading && (
              <div className={`text-center py-8 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="text-muted-foreground text-lg font-medium">{t('sessionManagement.noActiveStudents')}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('sessionManagement.studentsAfterRegistration')}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
