
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
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'trial-completed' | 'trial-ghosted' | 'rescheduled';

const EnhancedTeacherTrials: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [rescheduleItem, setRescheduleItem] = useState<TeacherMixedTrialItem | null>(null);
  const [trialOutcomeItem, setTrialOutcomeItem] = useState<TeacherMixedTrialItem | null>(null);
  const [trialOutcomeType, setTrialOutcomeType] = useState<'completed' | 'ghosted'>('completed');
  
  const { trialData, loading: trialsLoading, confirmTrial, refreshTrialData } = useTeacherMixedTrialData();
  const { logContact, openWhatsApp } = useWhatsAppContact();

  // PHASE 1: Improved filtering with better status handling
  const filteredItems = trialData.filter(item => {
    const statusMatch = statusFilter === 'all' || item.data.status === statusFilter;
    return statusMatch;
  });

  // PHASE 2: Better item categorization with consistent status handling
  const pendingConfirmedItems = filteredItems.filter(item => 
    item.data.status === 'pending' || item.data.status === 'confirmed'
  );
  
  const completedItems = filteredItems.filter(item => 
    item.data.status === 'trial-completed' || item.data.status === 'trial-ghosted'
  );

  // PHASE 4 FIX: Enhanced contact handling with family support
  const handleContactItem = async (phone: string, name: string) => {
    try {
      console.log('📞 PHASE 4: Enhanced contact handling:', { phone, name });
      openWhatsApp(phone);
      
      // PHASE 4 FIX: Optimized refresh timing
      setTimeout(() => refreshTrialData(), 300);
    } catch (error) {
      console.error('❌ Error handling contact:', error);
    }
  };

  // PHASE 4 FIX: Enhanced trial confirmation with better family handling
  const handleConfirmTrial = async (item: TeacherMixedTrialItem) => {
    console.log('✅ PHASE 4: Enhanced trial confirmation for:', item.type, item.id);
    
    try {
      const success = await confirmTrial(item);
      if (success) {
        console.log('✅ PHASE 4: Trial confirmed successfully for item:', item.id);
        if (item.type === 'family') {
          console.log('👨‍👩‍👧‍👦 PHASE 4: Family trial confirmed - all students updated atomically');
        }
      }
    } catch (error) {
      console.error('❌ PHASE 4: Error in handleConfirmTrial:', error);
    }
  };

  // PHASE 3 FIX: Enhanced outcome handling with session validation
  const handleMarkCompleted = (item: TeacherMixedTrialItem) => {
    console.log('🎯 PHASE 3: Enhanced completed trial outcome for item:', {
      type: item.type,
      id: item.id,
      hasSessionId: !!item.data.sessionId
    });
    
    // PHASE 3 FIX: Validate session data before opening modal
    if (!item.data.sessionId) {
      console.error('❌ PHASE 3: Cannot mark as completed - no session ID for:', item.type, item.id);
      toast.error(`Cannot mark ${item.type} trial as completed - session data not found. Please refresh and try again.`);
      return;
    }
    
    setTrialOutcomeItem(item);
    setTrialOutcomeType('completed');
  };

  const handleMarkGhosted = (item: TeacherMixedTrialItem) => {
    console.log('👻 PHASE 3: Enhanced ghosted trial outcome for item:', {
      type: item.type,
      id: item.id,
      hasSessionId: !!item.data.sessionId
    });
    
    // PHASE 3 FIX: Validate session data before opening modal
    if (!item.data.sessionId) {
      console.error('❌ PHASE 3: Cannot mark as ghosted - no session ID for:', item.type, item.id);
      toast.error(`Cannot mark ${item.type} trial as ghosted - session data not found. Please refresh and try again.`);
      return;
    }
    
    setTrialOutcomeItem(item);
    setTrialOutcomeType('ghosted');
  };

  const handleTrialOutcomeSuccess = () => {
    console.log('✅ PHASE 3: Enhanced trial outcome submitted successfully');
    setTrialOutcomeItem(null);
    refreshTrialData();
  };

  // PHASE 4 FIX: Enhanced reschedule handling with better family support
  const handleReschedule = (item: TeacherMixedTrialItem) => {
    console.log('🔄 CRITICAL FIX: Enhanced reschedule for item:', {
      type: item.type,
      id: item.id,
      hasTrialDate: !!item.data.trialDate,
      hasTrialTime: !!item.data.trialTime
    });
    
    if (item.type === 'family') {
      console.log('👨‍👩‍👧‍👦 CRITICAL FIX: Family reschedule - now fully supported with proper student ID handling');
    }
    
    setRescheduleItem(item);
  };

  const handleRescheduleSuccess = () => {
    console.log('✅ CRITICAL FIX: Enhanced reschedule completed successfully');
    setRescheduleItem(null);
    refreshTrialData();
  };

  // CRITICAL FIX: Enhanced student creation with proper family handling
  const createStudentForModal = async (item: TeacherMixedTrialItem) => {
    console.log('🔧 CRITICAL FIX: Creating student object for modal:', {
      type: item.type,
      id: item.id,
      hasSessionId: !!item.data.sessionId
    });

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
        sessionId: studentData.sessionId,
      };
    } else {
      // CRITICAL FIX: For family trials, fetch the first student ID from the family group
      const familyData = item.data as TeacherTrialFamily;
      
      console.log('🔍 CRITICAL FIX: Fetching first student from family group:', item.id);
      
      try {
        const { data: firstStudent, error } = await supabase
          .from('students')
          .select('id, name, age, phone, country, trial_date, trial_time, unique_id, parent_name, notes, status, assigned_teacher_id, family_group_id')
          .eq('family_group_id', item.id)
          .limit(1)
          .single();

        if (error || !firstStudent) {
          console.error('❌ CRITICAL FIX: Failed to fetch first student from family:', error);
          toast.error('Failed to load family student data. Please refresh and try again.');
          throw new Error('Family student not found');
        }

        console.log('✅ CRITICAL FIX: Successfully fetched first student from family:', {
          studentId: firstStudent.id,
          familyGroupId: firstStudent.family_group_id
        });

        return {
          id: firstStudent.id, // CRITICAL FIX: Use actual student ID, not family group ID
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
          sessionId: familyData.sessionId,
        };
      } catch (error) {
        console.error('❌ CRITICAL FIX: Error in family student creation:', error);
        throw error;
      }
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

      {/* CRITICAL FIX: Enhanced Modals with async student creation */}
      {rescheduleItem && (
        <RescheduleModal
          student={null} // Will be loaded async inside the modal
          studentData={rescheduleItem} // Pass the item data instead
          open={!!rescheduleItem}
          onClose={() => setRescheduleItem(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      {trialOutcomeItem && (
        <TrialOutcomeModal
          student={null} // Will be loaded async inside the modal
          studentData={trialOutcomeItem} // Pass the item data instead
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
