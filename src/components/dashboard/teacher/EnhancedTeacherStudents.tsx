
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeacherActiveStudents, ActiveStudentItem, StudentProgress, ActiveFamilyGroup } from '@/hooks/useTeacherActiveStudents';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { CompactStudentCard } from '@/components/teacher/CompactStudentCard';
import { UnifiedFamilyCard } from '@/components/teacher/UnifiedFamilyCard';
import { SessionEditModal } from '@/components/teacher/SessionEditModal';
import { useWhatsAppContact } from '@/hooks/useWhatsAppContact';
import { toast } from 'sonner';

interface EditingSession {
  sessionData: any;
  studentName: string;
  studentId: string;
}

const EnhancedTeacherStudents: React.FC = () => {
  const { students, loading, refreshStudents } = useTeacherActiveStudents();
  const [editingSession, setEditingSession] = useState<EditingSession | null>(null);
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { openWhatsApp, logContact, loading: contactLoading } = useWhatsAppContact();

  // Type guards
  const isIndividualStudent = (item: ActiveStudentItem): item is StudentProgress => {
    return !('type' in item) || (item as any).type !== 'family';
  };

  const isFamilyGroup = (item: ActiveStudentItem): item is ActiveFamilyGroup => {
    return 'type' in item && (item as ActiveFamilyGroup).type === 'family';
  };

  const handleEditSession = (sessionData: any, studentName: string, studentId: string) => {
    console.log('Edit session:', sessionData);
    setEditingSession({
      sessionData,
      studentName,
      studentId
    });
  };

  const handleContactFamily = (phone: string, name: string) => {
    console.log('Contact family:', name, phone);
    // Basic contact without logging for families (since we don't have individual student IDs easily accessible)
    const message = `Hello ${name}! I'm reaching out regarding your family's learning progress. I'd like to discuss how your children are doing in their sessions and address any questions you might have.`;
    openWhatsApp(phone, message);
    toast.success(`WhatsApp opened for ${name}`);
  };

  const handleWhatsAppContact = async (phone: string, name: string) => {
    const message = `Hello ${name}! I'm reaching out regarding your family's learning progress. I'd like to discuss how your children are doing in their sessions and address any questions you might have.`;
    openWhatsApp(phone, message);
    
    // For families, we'll log contact against the first student in the family
    const familyItem = students.find(item => 
      'type' in item && item.type === 'family' && item.parentName === name
    ) as ActiveFamilyGroup;
    
    if (familyItem && familyItem.students.length > 0) {
      const firstStudentId = familyItem.students[0].studentId;
      await logContact(firstStudentId, 'follow_up', true, `Family contact via WhatsApp for ${name}`);
    }
    
    toast.success(`WhatsApp opened for ${name}`);
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {students.map((item, index) => {
            if (isFamilyGroup(item)) {
              return (
                <div key={item.id} style={{ animationDelay: `${index * 150}ms` }}>
                  <UnifiedFamilyCard
                    family={item}
                    mode="progress"
                    onContact={handleContactFamily}
                    onWhatsAppContact={handleWhatsAppContact}
                    onEditSession={handleEditSession}
                  />
                </div>
              );
            } else {
              return (
                <div key={item.studentId} style={{ animationDelay: `${index * 150}ms` }}>
                  <CompactStudentCard
                    student={item}
                    onEditSession={(sessionData) => 
                      handleEditSession(sessionData, item.studentName, item.studentId)
                    }
                  />
                </div>
              );
            }
          })}
        </div>
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
