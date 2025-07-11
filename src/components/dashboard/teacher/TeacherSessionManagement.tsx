
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionCompletionModal } from '@/components/teacher/SessionCompletionModal';
import { SessionProgressTracker } from '@/components/teacher/SessionProgressTracker';
import { EnhancedSessionCard } from '@/components/teacher/EnhancedSessionCard';
import { SessionDateRangeSelector } from '@/components/teacher/SessionDateRangeSelector';
import { useSessionsByDateRange } from '@/hooks/useSessionsByDateRange';
import { useTeacherActiveStudents } from '@/hooks/useTeacherActiveStudents';
import { Clock, CheckCircle, Zap } from 'lucide-react';

const TeacherSessionManagement: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const { 
    sessions, 
    loading: sessionsLoading, 
    dateRange, 
    setDateRange, 
    refreshSessions 
  } = useSessionsByDateRange();
  const { students: activeStudents, loading: studentsLoading, refreshStudents } = useTeacherActiveStudents();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const handleCompleteSession = (session: any) => {
    console.log('📝 Opening session completion modal for:', session.studentName);
    setSelectedSession(session);
  };

  const handleSessionCompletionSuccess = () => {
    console.log('✅ Session completed successfully');
    setSelectedSession(null);
    refreshSessions();
    refreshStudents();
  };

  // Get priority sessions for focus mode
  const prioritySessions = sessions.filter(s => s.priority === 'high');
  const upcomingSessions = sessions.filter(s => s.priority !== 'high');

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Zap className="h-6 w-6 text-primary" />
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h2 className="text-2xl font-bold">{t('sessionManagement.title')}</h2>
          <p className="text-muted-foreground">
            Enhanced session management with smart insights
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dashboard-card">
          <CardHeader>
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div>
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock className="h-5 w-5 text-primary" />
                  Session Overview
                </CardTitle>
                <CardDescription className={isRTL ? 'text-right' : 'text-left'}>
                  Smart session scheduling with priority insights
                </CardDescription>
              </div>
              <SessionDateRangeSelector
                value={dateRange}
                onChange={setDateRange}
                sessionCount={sessions.length}
                isRTL={isRTL}
              />
            </div>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className={`flex items-center justify-center py-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className={`text-muted-foreground ${isRTL ? 'mr-2' : 'ml-2'}`}>
                  Loading sessions...
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Priority Sessions Section */}
                {prioritySessions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-primary flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Priority Sessions
                    </h4>
                    {prioritySessions.map((session) => (
                      <EnhancedSessionCard
                        key={session.id}
                        session={session}
                        onCompleteSession={handleCompleteSession}
                        isRTL={isRTL}
                      />
                    ))}
                  </div>
                )}

                {/* Upcoming Sessions Section */}
                {upcomingSessions.length > 0 && (
                  <div className="space-y-3">
                    {prioritySessions.length > 0 && (
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Upcoming Sessions
                      </h4>
                    )}
                    {upcomingSessions.map((session) => (
                      <EnhancedSessionCard
                        key={session.id}
                        session={session}
                        onCompleteSession={handleCompleteSession}
                        isRTL={isRTL}
                      />
                    ))}
                  </div>
                )}
                
                {sessions.length === 0 && !sessionsLoading && (
                  <div className={`text-center py-8 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className="text-muted-foreground text-lg font-medium">
                      No sessions found for {dateRange.replace('-', ' ')}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Try selecting a different time range
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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
      </div>

      <SessionCompletionModal
        session={selectedSession}
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        onSuccess={handleSessionCompletionSuccess}
      />
    </div>
  );
};

export default TeacherSessionManagement;
