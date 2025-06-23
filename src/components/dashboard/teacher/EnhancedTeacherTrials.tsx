
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
import { TeacherMixedTrialItem } from '@/hooks/useTeacherMixedTrialData';
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

  // Filter items based on status and date
  const filteredItems = trialItems.filter(item => {
    const statusMatch = statusFilter === 'all' || item.data.status === statusFilter;
    // Note: Date filtering would need additional logic based on trial_date
    return statusMatch;
  });

  // Separate items into categories
  const pendingConfirmedItems = filteredItems.filter(item => 
    item.data.status === 'pending' || item.data.status === 'confirmed'
  );
  
  const completedItems = filteredItems.filter(item => 
    item.data.status === 'trial-completed' || item.data.status === 'trial-ghosted' || 
    (item.data.status === 'confirmed' && /* has been rescheduled */ false) // TODO: Add reschedule logic
  );

  const handleContactItem = async (phone: string, name: string) => {
    try {
      openWhatsApp(phone);
      // For family trials, we'll log contact against the family group ID
      // For individual trials, we'll log against the student ID
      // This will be handled by the contact logging system
      await refreshTrialData();
    } catch (error) {
      console.error('Error handling contact:', error);
    }
  };

  const handleConfirmTrial = async (item: TeacherMixedTrialItem) => {
    const success = await confirmTrial(item);
    if (success) {
      console.log('✅ Trial confirmed successfully for item:', item.id);
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

  const handleReschedule = (item: TeacherMixedTrialItem) => {
    console.log('🔄 Opening reschedule modal for item:', item.id);
    setRescheduleItem(item);
  };

  const handleRescheduleSuccess = () => {
    console.log('✅ Reschedule completed successfully');
    setRescheduleItem(null);
    refreshTrialData();
  };

  // Helper function to create a compatible student object for modals
  const createStudentForModal = (item: TeacherMixedTrialItem) => {
    if (item.type === 'individual') {
      return {
        id: item.data.id,
        name: item.data.name,
        age: item.data.age,
        phone: item.data.phone,
        country: item.data.country,
        trialDate: item.data.trialDate,
        trialTime: item.data.trialTime,
        uniqueId: item.data.uniqueId,
        parentName: item.data.parentName,
        notes: item.data.notes,
      };
    } else {
      // For family, create a representative student object
      return {
        id: item.data.id,
        name: item.data.parentName,
        age: 0, // Not applicable for family
        phone: item.data.phone,
        country: item.data.country,
        trialDate: item.data.trialDate,
        trialTime: item.data.trialTime,
        uniqueId: item.data.uniqueId,
        parentName: item.data.parentName,
        notes: item.data.notes,
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

      {/* Modals */}
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
