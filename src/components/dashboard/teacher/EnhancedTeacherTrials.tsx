
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateFilter, DateRange } from '@/components/teacher/DateFilter';
import { useTeacherMixedTrialDataWithDateFilter } from '@/hooks/useTeacherMixedTrialDataWithDateFilter';
import { useWhatsAppContact } from '@/hooks/useWhatsAppContact';
import { UnifiedTeacherStudentCard } from '@/components/teacher/UnifiedTeacherStudentCard';
import { RescheduleModal } from '@/components/teacher/RescheduleModal';
import TrialOutcomeModal from '@/components/teacher/TrialOutcomeModal';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { TeacherMixedTrialItem, TeacherTrialStudent, TeacherTrialFamily } from '@/hooks/useTeacherMixedTrialDataWithDateFilter';
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
  
  // PHASE 2 FIX: Use the new date-filtered hook
  const { trialData, loading: trialsLoading, confirmTrial, refreshTrialData } = useTeacherMixedTrialDataWithDateFilter(dateRange);
  const { logContact, openWhatsApp } = useWhatsAppContact();

  // PHASE 2: Improved filtering with better status handling and date filtering
  const filteredItems = trialData.filter(item => {
    const statusMatch = statusFilter === 'all' || item.data.status === statusFilter;
    return statusMatch;
  });

  // Better item categorization with consistent status handling
  const pendingConfirmedItems = filteredItems.filter(item => 
    item.data.status === 'pending' || item.data.status === 'confirmed'
  );
  
  const completedItems = filteredItems.filter(item => 
    item.data.status === 'trial-completed' || item.data.status === 'trial-ghosted'
  );

  // Enhanced contact handling with family support
  const handleContactItem = async (phone: string, name: string) => {
    try {
      console.log('📞 Enhanced contact handling:', { phone, name });
      openWhatsApp(phone);
      
      // Optimized refresh timing
      setTimeout(() => refreshTrialData(), 300);
    } catch (error) {
      console.error('❌ Error handling contact:', error);
    }
  };

  // Enhanced trial confirmation with better family handling
  const handleConfirmTrial = async (item: TeacherMixedTrialItem) => {
    console.log('✅ Enhanced trial confirmation for:', item.type, item.id);
    
    try {
      const success = await confirmTrial(item);
      if (success) {
        console.log('✅ Trial confirmed successfully for item:', item.id);
        if (item.type === 'family') {
          console.log('👨‍👩‍👧‍👦 Family trial confirmed - all students updated atomically');
        }
      }
    } catch (error) {
      console.error('❌ Error in handleConfirmTrial:', error);
    }
  };

  // Enhanced outcome handling with session validation
  const handleMarkCompleted = (item: TeacherMixedTrialItem) => {
    console.log('🎯 Enhanced completed trial outcome for item:', {
      type: item.type,
      id: item.id,
      hasSessionId: !!item.data.sessionId
    });
    
    // Validate session data before opening modal
    if (!item.data.sessionId) {
      console.error('❌ Cannot mark as completed - no session ID for:', item.type, item.id);
      toast.error(`Cannot mark ${item.type} trial as completed - session data not found. Please refresh and try again.`);
      return;
    }
    
    setTrialOutcomeItem(item);
    setTrialOutcomeType('completed');
  };

  const handleMarkGhosted = (item: TeacherMixedTrialItem) => {
    console.log('👻 Enhanced ghosted trial outcome for item:', {
      type: item.type,
      id: item.id,
      hasSessionId: !!item.data.sessionId
    });
    
    // Validate session data before opening modal
    if (!item.data.sessionId) {
      console.error('❌ Cannot mark as ghosted - no session ID for:', item.type, item.id);
      toast.error(`Cannot mark ${item.type} trial as ghosted - session data not found. Please refresh and try again.`);
      return;
    }
    
    setTrialOutcomeItem(item);
    setTrialOutcomeType('ghosted');
  };

  const handleTrialOutcomeSuccess = () => {
    console.log('✅ Enhanced trial outcome submitted successfully');
    setTrialOutcomeItem(null);
    refreshTrialData();
  };

  // Enhanced reschedule handling with better family support
  const handleReschedule = (item: TeacherMixedTrialItem) => {
    console.log('🔄 Enhanced reschedule for item:', {
      type: item.type,
      id: item.id,
      hasTrialDate: !!item.data.trialDate,
      hasTrialTime: !!item.data.trialTime
    });
    
    if (item.type === 'family') {
      console.log('👨‍👩‍👧‍👦 Family reschedule - now fully supported with proper student ID handling');
    }
    
    setRescheduleItem(item);
  };

  const handleRescheduleSuccess = () => {
    console.log('✅ Enhanced reschedule completed successfully');
    setRescheduleItem(null);
    refreshTrialData();
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
          {/* PHASE 2 FIX: Date filter now properly connected */}
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

      {/* Enhanced Modals */}
      {rescheduleItem && (
        <RescheduleModal
          student={null}
          studentData={rescheduleItem}
          open={!!rescheduleItem}
          onClose={() => setRescheduleItem(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      {trialOutcomeItem && (
        <TrialOutcomeModal
          student={null}
          studentData={trialOutcomeItem}
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
