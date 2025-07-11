
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionCompletionModal } from '@/components/teacher/SessionCompletionModal';
import { SessionProgressTracker } from '@/components/teacher/SessionProgressTracker';
import { EnhancedSessionCard } from '@/components/teacher/EnhancedSessionCard';
import { useEnhancedSessionData, EnhancedSessionData } from '@/hooks/useEnhancedSessionData';
import { useTeacherActiveStudents } from '@/hooks/useTeacherActiveStudents';
import { Clock, Play, CheckCircle, Calendar, User, Loader2 } from 'lucide-react';

const TeacherSessionManagement: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const { sessions: enhancedSessions, loading: sessionsLoading, refreshSessions } = useEnhancedSessionData();
  const { students: activeStudents, loading: studentsLoading, refreshStudents } = useTeacherActiveStudents();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const handleCompleteSession = (session: EnhancedSessionData) => {
    console.log('📝 Opening session completion modal for:', session.studentName);
    // Convert to format expected by SessionCompletionModal
    const modalSession = {
      id: session.id,
      studentName: session.studentName,
      sessionNumber: session.sessionNumber,
      totalSessions: session.totalSessions,
      scheduledTime: session.formattedDateTime,
      completedSessions: session.sessionNumber - 1,
      studentId: session.studentId
    };
    setSelectedSession(modalSession);
  };

  const handleContact = (phone: string, name: string) => {
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;
    window.open(whatsappUrl, '_blank');
    console.log('📞 Opening WhatsApp contact for:', name, phone);
  };

  const handleSessionCompletionSuccess = () => {
    console.log('✅ Session completed successfully');
    setSelectedSession(null);
    refreshSessions();
    refreshStudents();
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Clock className="h-6 w-6 text-primary" />
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h2 className="text-2xl font-bold text-foreground">{t('sessionManagement.title')}</h2>
          <p className="text-muted-foreground">
            {t('sessionManagement.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Sessions - Enhanced Design */}
        <Card className="dashboard-card border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Play className="h-5 w-5 text-primary" />
              Today's Sessions
            </CardTitle>
            <CardDescription className={isRTL ? 'text-right' : 'text-left'}>
              Your scheduled sessions for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className={`flex items-center justify-center py-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className={`text-muted-foreground ${isRTL ? 'mr-2' : 'ml-2'}`}>
                  Loading sessions...
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {enhancedSessions.map((session) => (
                  <EnhancedSessionCard
                    key={session.id}
                    session={session}
                    onContact={handleContact}
                    onCompleteSession={handleCompleteSession}
                  />
                ))}
                
                {enhancedSessions.length === 0 && !sessionsLoading && (
                  <div className={`text-center py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg font-medium">No sessions scheduled for today</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Check back tomorrow or view your upcoming sessions
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Student Progress */}
        <Card className="dashboard-card border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CheckCircle className="h-5 w-5 text-primary" />
              {t('sessionManagement.activeStudentProgress')}
            </CardTitle>
            <CardDescription className={isRTL ? 'text-right' : 'text-left'}>
              {t('sessionManagement.trackProgress')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className={`flex items-center justify-center py-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  <div className={`text-center py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
