
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateFilter, DateRange } from '@/components/teacher/DateFilter';
import { useTeacherMixedTrialData } from '@/hooks/useTeacherMixedTrialData';
import { useWhatsAppContact } from '@/hooks/useWhatsAppContact';
import { UnifiedTeacherStudentCard } from '@/components/teacher/UnifiedTeacherStudentCard';
import { RescheduleModal } from '@/components/teacher/RescheduleModal';
import TrialOutcomeModal from '@/components/teacher/TrialOutcomeModal';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { TeacherMixedTrialItem, TeacherTrialStudent, TeacherTrialFamily } from '@/hooks/useTeacherMixedTrialData';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'trial-completed' | 'trial-ghosted' | 'rescheduled';

const EnhancedTeacherTrials: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [rescheduleItem, setRescheduleItem] = useState<TeacherMixedTrialItem | null>(null);
  const [trialOutcomeItem, setTrialOutcomeItem] = useState<TeacherMixedTrialItem | null>(null);
  const [trialOutcomeType, setTrialOutcomeType] = useState<'completed' | 'ghosted'>('completed');
  
  const { trialItems, loading: trialsLoading, confirmTrial, refreshTrialData } = useTeacherMixedTrialData();
  const { logContact, openWhatsApp } = useWhatsAppContact();

  // PHASE 1: Improved filtering with better status handling
  const filteredItems = trialItems.filter(item => {
    const statusMatch = statusFilter === 'all' || item.data.status === statusFilter;
    // PHASE 4: Enhanced date filtering can be added here
    return statusMatch;
  });

  // PHASE 2: Better item categorization with consistent status handling
  const pendingConfirmedItems = filteredItems.filter(item => 
    item.data.status === 'pending' || item.data.status === 'confirmed'
  );
  
  const completedItems = filteredItems.filter(item => 
    item.data.status === 'trial-completed' || item.data.status === 'trial-ghosted'
  );

  // PHASE 4: Enhanced contact handling with better error handling
  const handleContactItem = async (phone: string, name: string) => {
    try {
      console.log('📞 Contacting:', { phone, name });
      openWhatsApp(phone);
      
      // PHASE 4: Debounced refresh to prevent excessive updates
      setTimeout(() => refreshTrialData(), 500);
    } catch (error) {
      console.error('❌ Error handling contact:', error);
    }
  };

  // PHASE 2: Enhanced confirmation with better feedback
  const handleConfirmTrial = async (item: TeacherMixedTrialItem) => {
    console.log('✅ Starting trial confirmation for:', item.type, item.id);
    
    try {
      const success = await confirmTrial(item);
      if (success) {
        console.log('✅ Trial confirmed successfully for item:', item.id);
        // PHASE 4: Enhanced success feedback
        if (item.type === 'family') {
          console.log('👨‍👩‍👧‍👦 Family trial confirmed - all students updated');
        }
      }
    } catch (error) {
      console.error('❌ Error in handleConfirmTrial:', error);
    }
  };

  const handleMarkCompleted = (item: TeacherMixedTrialItem) => {
    console.log('🎯 Opening completed trial outcome modal for item:', item.id);
    setTrialOutcomeItem(item);
    setTrialOutcomeType('completed');
  };

  const handleMarkGhosted = (item: TeacherMixedTrialItem) => {
    console.log('👻 Opening ghosted trial outcome modal for item:', item.id);
    setTrialOutcomeItem(item);
    setTrialOutcomeType('ghosted');
  };

  const handleTrialOutcomeSuccess = () => {
    console.log('✅ Trial outcome submitted successfully');
    setTrialOutcomeItem(null);
    refreshTrialData();
  };

  // PHASE 3: Enhanced reschedule handling with family support
  const handleReschedule = (item: TeacherMixedTrialItem) => {
    console.log('🔄 Opening reschedule modal for item:', item.id, 'type:', item.type);
    
    if (item.type === 'family') {
      console.warn('⚠️ Family reschedule flow - enhanced handling needed');
      // PHASE 3: TODO - Implement proper family reschedule flow
      // For now, we'll allow it but with a warning
    }
    
    setRescheduleItem(item);
  };

  const handleRescheduleSuccess = () => {
    console.log('✅ Reschedule completed successfully');
    setRescheduleItem(null);
    refreshTrialData();
  };

  // PHASE 2: Enhanced student creation for modals with better type safety
  const createStudentForModal = (item: TeacherMixedTrialItem) => {
    if (item.type === 'individual') {
      const studentData = item.data as TeacherTrialStudent;
      return {
        id: studentData.id,
        name: studentData.name,
        age: studentData.age,
        phone: studentData.phone,
        country: studentData.country,
        trialDate: studentData.trialDate,
        trialTime: studentData.trialTime,
        uniqueId: studentData.uniqueId,
        parentName: studentData.parentName,
        notes: studentData.notes,
        status: studentData.status,
        sessionId: studentData.sessionId, // PHASE 2: Ensure session ID is passed correctly
      };
    } else {
      // PHASE 2: Enhanced family to student conversion for modals
      const familyData = item.data as TeacherTrialFamily;
      return {
        id: familyData.id,
        name: familyData.parentName,
        age: 0, // Not applicable for family
        phone: familyData.phone,
        country: familyData.country,
        trialDate: familyData.trialDate,
        trialTime: familyData.trialTime,
        uniqueId: familyData.uniqueId,
        parentName: familyData.parentName,
        notes: familyData.notes,
        status: familyData.status,
        sessionId: familyData.sessionId, // PHASE 2: Family sessions handled differently
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Trial Session Management</h1>
          <p className="text-muted-foreground">Manage individual and family trial sessions</p>
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
          {pendingConfirmedItems.length > 0 && (
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Active Trials
                  <Badge variant="outline">{pendingConfirmedItems.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Pending and confirmed trial sessions requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pendingConfirmedItems.map((item) => (
                    <UnifiedTeacherStudentCard
                      key={item.id}
                      item={item}
                      onContact={handleContactItem}
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
          {completedItems.length > 0 && (
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Trial History
                  <Badge variant="outline">{completedItems.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Completed, ghosted, and rescheduled trial sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {completedItems.map((item) => (
                    <UnifiedTeacherStudentCard
                      key={item.id}
                      item={item}
                      onContact={handleContactItem}
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
          {filteredItems.length === 0 && (
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

      {/* PHASE 3: Enhanced Modals with better error handling */}
      {rescheduleItem && (
        <RescheduleModal
          student={createStudentForModal(rescheduleItem)}
          open={!!rescheduleItem}
          onClose={() => setRescheduleItem(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      {trialOutcomeItem && (
        <TrialOutcomeModal
          student={createStudentForModal(trialOutcomeItem)}
          outcome={trialOutcomeType}
          open={!!trialOutcomeItem}
          onClose={() => setTrialOutcomeItem(null)}
          onSuccess={handleTrialOutcomeSuccess}
        />
      )}
    </div>
  );
};

export default EnhancedTeacherTrials;
