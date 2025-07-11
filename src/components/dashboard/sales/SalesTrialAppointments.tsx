
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Calendar } from 'lucide-react';
import { useMixedStudentData, MixedStudentItem } from '@/hooks/useMixedStudentData';
import { useStudentFollowUp } from '@/hooks/useStudentFollowUp';
import { StatusSpecificTrialCard } from './StatusSpecificTrialCard';
import { RealTimeMetrics } from './RealTimeMetrics';
import { StudentEditModal } from '@/components/sales/StudentEditModal';
import { StatusChangeModal } from '@/components/sales/StatusChangeModal';
import { PaymentLinkModal } from '@/components/sales/PaymentLinkModal';
import { PaymentLinkSuccessModal } from '@/components/sales/PaymentLinkSuccessModal';
import { ScheduleFollowUpModal } from '@/components/sales/ScheduleFollowUpModal';
import { CompleteFollowUpModal } from '@/components/sales/CompleteFollowUpModal';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudent } from '@/types/trial';
import { toast } from 'sonner';

const SalesTrialAppointments: React.FC = () => {
  const { items, loading, refetchData, getStatsCount } = useMixedStudentData();
  const { getFollowUpData } = useStudentFollowUp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<MixedStudentItem | null>(null);
  const [changingStatusItem, setChangingStatusItem] = useState<MixedStudentItem | null>(null);
  const [paymentLinkItem, setPaymentLinkItem] = useState<MixedStudentItem | null>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);
  const [schedulingFollowUpItem, setSchedulingFollowUpItem] = useState<MixedStudentItem | null>(null);
  const [completingFollowUpItem, setCompletingFollowUpItem] = useState<{
    item: MixedStudentItem;
    followUpData: any;
  } | null>(null);

  // Filter items directly from useMixedStudentData (which already includes both individual and family items)
  const filteredItems = items.filter(item => {
    const data = item.data;
    const name = item.type === 'family' 
      ? (data as FamilyGroup).parent_name 
      : (data as TrialSessionFlowStudent).name;
    const uniqueId = item.type === 'family'
      ? (data as FamilyGroup).unique_id
      : (data as TrialSessionFlowStudent).uniqueId;
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         data.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || data.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'trial-completed', label: 'Trial Completed' },
    { value: 'trial-ghosted', label: 'Trial Ghosted' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'awaiting-payment', label: 'Awaiting Payment' },
    { value: 'paid', label: 'Paid' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'dropped', label: 'Dropped' }
  ];

  const handleContact = (item: MixedStudentItem) => {
    const phone = item.data.phone;
    const name = item.type === 'family' 
      ? (item.data as FamilyGroup).parent_name 
      : (item.data as TrialSessionFlowStudent).name;
    
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Hello ${name}! This is regarding your trial session booking.`;
    window.open(whatsappUrl, '_blank');
  };

  const handleScheduleFollowUp = (item: MixedStudentItem) => {
    setSchedulingFollowUpItem(item);
  };

  const handleCompleteFollowUp = async (item: MixedStudentItem) => {
    if (item.type === 'individual') {
      const studentData = item.data as TrialSessionFlowStudent;
      const followUpData = await getFollowUpData(studentData.id);
      
      if (followUpData) {
        setCompletingFollowUpItem({
          item,
          followUpData
        });
      } else {
        toast.error('No pending follow-up found for this student');
      }
    } else {
      toast.info('Family follow-up completion coming soon');
    }
  };

  const handlePaymentLinkSuccess = (paymentData: any, studentData: any) => {
    const name = paymentLinkItem?.type === 'family' 
      ? (paymentLinkItem.data as FamilyGroup).parent_name 
      : (paymentLinkItem.data as TrialSessionFlowStudent).name;
    
    setPaymentSuccessData({
      url: paymentData.url,
      amount: paymentData.amount || 0,
      currency: paymentData.currency || 'USD',
      studentName: name,
      studentPhone: paymentLinkItem?.data.phone
    });
    
    setPaymentLinkItem(null);
    refetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sales-primary mx-auto"></div>
          <p className="text-sales-text-secondary mt-2">Loading trial appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sales-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-sales-text-primary mb-2">Trial Appointments</h1>
            <p className="text-sm text-sales-text-secondary">
              Manage trial sessions, payments, and follow-ups efficiently
            </p>
          </div>
          <Button 
            onClick={() => refetchData()} 
            variant="outline" 
            size="sm"
            className="sales-btn-ghost"
          >
            <Search className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Search and Filter Controls */}
        <Card className="bg-sales-bg-secondary border-sales-border shadow-sales-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sales-text-muted" />
                  <Input
                    placeholder="Search appointments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-sales-bg-secondary border-sales-border focus:border-sales-primary focus:ring-2 focus:ring-sales-primary/10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-sales-bg-secondary border-sales-border focus:border-sales-primary">
                    <Filter className="h-4 w-4 mr-2 text-sales-text-muted" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-sales-bg-secondary border-sales-border shadow-sales-md">
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="focus:bg-sales-bg-tertiary">
                        {option.label} ({option.value === 'all' ? filteredItems.length : getStatsCount(option.value)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-Time Metrics Dashboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-sales-text-primary">Status Overview</h2>
            <div className="text-xs text-sales-text-muted">
              Live updates • Auto-refresh enabled
            </div>
          </div>
          <RealTimeMetrics />
        </div>

        {/* Trial Appointments List */}
        {filteredItems.length === 0 ? (
          <Card className="bg-sales-bg-secondary border-sales-border shadow-sales-sm">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-sales-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-sales-text-secondary mb-2">
                  No trial appointments found
                </h3>
                <p className="text-sm text-sales-text-muted max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria to find appointments'
                    : 'You haven\'t created any trial appointments yet. New bookings will appear here.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <StatusSpecificTrialCard
                key={`${item.type}-${item.id}`}
                item={item}
                onEditInfo={setEditingItem}
                onContact={handleContact}
                onCreatePaymentLink={setPaymentLinkItem}
                onScheduleFollowUp={handleScheduleFollowUp}
                onCompleteFollowUp={handleCompleteFollowUp}
                onRescheduleFollowUp={(item) => {
                  toast.info('Reschedule follow-up functionality coming soon');
                }}
                onMarkAsDropped={(item) => {
                  toast.info('Mark as dropped functionality coming soon');
                }}
                onRescheduleAppointment={(item) => {
                  toast.info('Reschedule appointment functionality coming soon');
                }}
                onRecreatePaymentLink={setPaymentLinkItem}
                onMarkAsCanceled={(item) => {
                  toast.info('Mark as canceled functionality coming soon');
                }}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        {editingItem && editingItem.type === 'individual' && (
          <StudentEditModal
            student={editingItem.data as TrialSessionFlowStudent}
            open={!!editingItem}
            onClose={() => setEditingItem(null)}
            onSuccess={() => {
              setEditingItem(null);
              refetchData();
            }}
          />
        )}

        {changingStatusItem && changingStatusItem.type === 'individual' && (
          <StatusChangeModal
            student={changingStatusItem.data as TrialSessionFlowStudent}
            open={!!changingStatusItem}
            onClose={() => setChangingStatusItem(null)}
            onSuccess={() => {
              setChangingStatusItem(null);
              refetchData();
            }}
          />
        )}

        {paymentLinkItem && (
          <PaymentLinkModal
            student={paymentLinkItem.data}
            open={!!paymentLinkItem}
            onClose={() => setPaymentLinkItem(null)}
            onSuccess={handlePaymentLinkSuccess}
          />
        )}

        {paymentSuccessData && (
          <PaymentLinkSuccessModal
            open={!!paymentSuccessData}
            onClose={() => setPaymentSuccessData(null)}
            paymentData={paymentSuccessData}
          />
        )}

        {schedulingFollowUpItem && (
          <ScheduleFollowUpModal
            student={schedulingFollowUpItem.data}
            open={!!schedulingFollowUpItem}
            onClose={() => setSchedulingFollowUpItem(null)}
            onSuccess={() => {
              setSchedulingFollowUpItem(null);
              refetchData();
            }}
          />
        )}

        {completingFollowUpItem && (
          <CompleteFollowUpModal
            student={completingFollowUpItem.item.data}
            followUpData={completingFollowUpItem.followUpData}
            open={!!completingFollowUpItem}
            onClose={() => setCompletingFollowUpItem(null)}
            onSuccess={() => {
              setCompletingFollowUpItem(null);
              refetchData();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SalesTrialAppointments;
