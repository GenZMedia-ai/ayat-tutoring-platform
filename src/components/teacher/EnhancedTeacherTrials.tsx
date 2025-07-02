
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DateFilter, DateRange } from '@/components/teacher/DateFilter';
import { useTeacherMixedTrialData } from '@/hooks/useTeacherMixedTrialData';
import { useWhatsAppContact } from '@/hooks/useWhatsAppContact';
import { useTrialOutcomes } from '@/hooks/useTrialOutcomes';
import { UnifiedTeacherStudentCard } from '@/components/teacher/UnifiedTeacherStudentCard';
import { RescheduleModal } from '@/components/teacher/RescheduleModal';
import TrialOutcomeModal from '@/components/teacher/TrialOutcomeModal';
import { LoadingSpinner } from '@/components/teacher/LoadingSpinner';
import { TeacherMixedTrialItem, TeacherTrialStudent, TeacherTrialFamily } from '@/hooks/useTeacherMixedTrialData';
import { Badge } from '@/components/ui/badge';
import { Filter, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'trial-completed' | 'trial-ghosted' | 'rescheduled' | 'paid';

const EnhancedTeacherTrials: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [rescheduleItem, setRescheduleItem] = useState<TeacherMixedTrialItem | null>(null);
  const [trialOutcomeItem, setTrialOutcomeItem] = useState<TeacherMixedTrialItem | null>(null);
  const [trialOutcomeType, setTrialOutcomeType] = useState<'completed' | 'ghosted'>('completed');
  const [refreshing, setRefreshing] = useState(false);
  
  const { trialData, loading: trialsLoading, confirmTrial, refreshTrialData } = useTeacherMixedTrialData();
  const { logContact, openWhatsApp } = useWhatsAppContact();
  const { repairFamilySessionLinks } = useTrialOutcomes();

  // Enhanced filtering with better status handling
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

  // Phase 2: Add paid items section
  const paidItems = filteredItems.filter(item => 
    item.data.status === 'paid'
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
      toast.error(`Cannot mark ${item.type} trial as completed - session data not found. Trying auto-repair...`);
      
      // Try auto-repair
      repairFamilySessionLinks().then(() => {
        toast.success('Session links repaired. Please try again.');
        refreshTrialData();
      }).catch(() => {
        toast.error('Auto-repair failed. Please refresh and try again.');
      });
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
      toast.error(`Cannot mark ${item.type} trial as ghosted - session data not found. Trying auto-repair...`);
      
      // Try auto-repair
      repairFamilySessionLinks().then(() => {
        toast.success('Session links repaired. Please try again.');
        refreshTrialData();
      }).catch(() => {
        toast.error('Auto-repair failed. Please refresh and try again.');
      });
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

  // Phase 2: Smart refresh function (replaces manual repair)
  const handleSmartRefresh = async () => {
    setRefreshing(true);
    try {
      toast.info('Refreshing trial data...');
      // Keep repair functionality but rename button
      await repairFamilySessionLinks();
      await refreshTrialData();
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Refresh failed. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Phase 2: Auto-refresh every 30 seconds when page is active
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (document.hasFocus() && !refreshing) {
        handleSmartRefresh();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshing]);

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Trial Session Management</h1>
          <p className="text-muted-foreground">Manage individual and family trial sessions</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSmartRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
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
                <SelectItem value="paid">Paid</SelectItem>
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

          {/* Phase 2: Paid Students Section */}
          {paidItems.length > 0 && (
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Paid Students Ready for Registration
                  <Badge variant="outline">{paidItems.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Students who have paid and need registration completion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {paidItems.map((item) => (
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

      {/* Enhanced Modals with async student creation */}
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
