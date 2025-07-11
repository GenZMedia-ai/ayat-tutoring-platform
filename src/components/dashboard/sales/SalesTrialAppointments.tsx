
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Calendar, RefreshCw } from 'lucide-react';
import { useMixedStudentData, MixedStudentItem } from '@/hooks/useMixedStudentData';
import { useFamilyGroups } from '@/hooks/useFamilyGroups';
import { UnifiedTrialCard } from '@/components/shared/UnifiedTrialCard';
import { FamilyCard } from '@/components/family/FamilyCard';
import { ModernStudentCard } from './ModernStudentCard';
import ModernStatusMetrics from './ModernStatusMetrics';
import { StudentEditModal } from '@/components/sales/StudentEditModal';
import { StatusChangeModal } from '@/components/sales/StatusChangeModal';
import { PaymentLinkModal } from '@/components/sales/PaymentLinkModal';
import { PaymentLinkSuccessModal } from '@/components/sales/PaymentLinkSuccessModal';
import { ScheduleFollowUpModal } from '@/components/sales/ScheduleFollowUpModal';
import { CompleteFollowUpModal } from '@/components/sales/CompleteFollowUpModal';
import { FollowUpManagementTab } from '@/components/sales/FollowUpManagementTab';
import { useStudentFollowUp } from '@/hooks/useStudentFollowUp';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudent } from '@/types/trial';
import { toast } from 'sonner';

const SalesTrialAppointments: React.FC = () => {
  const { items, loading, refetchData, getStatsCount } = useMixedStudentData();
  const { familyGroups, loading: familyLoading, fetchFamilyGroups, updateFamilyStatus } = useFamilyGroups();
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

  // Filter individual items
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

  const handleFamilyContact = (family: any) => {
    const message = `Hello ${family.parent_name}, this is regarding your family trial session. Please let us know if you have any questions.`;
    const whatsappUrl = `https://wa.me/${family.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
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

  if (loading || familyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800 mx-auto"></div>
          <p className="text-stone-600 mt-2">Loading trial appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Trial Appointments</h3>
          <p className="text-sm text-stone-600">
            Manage individual and family trial sessions, and process payments
          </p>
        </div>
        <Button onClick={() => {
          refetchData();
          fetchFamilyGroups();
        }} variant="outline" size="sm" className="border-stone-300 text-stone-700 hover:bg-stone-50">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Main Tabs for Trial Management */}
      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="individual">Individual Bookings</TabsTrigger>
          <TabsTrigger value="families">Family Groups</TabsTrigger>
          <TabsTrigger value="followup">Follow-up & Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          {/* Status Metrics */}
          <ModernStatusMetrics />

          {/* Search and Filter Controls */}
          <Card className="border-stone-200">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
                    <Input
                      placeholder="Search by name, ID, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-stone-300 focus:border-stone-500"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-stone-300 focus:border-stone-500">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label} ({option.value === 'all' ? filteredItems.length : getStatsCount(option.value)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Trials List */}
          {filteredItems.length === 0 ? (
            <Card className="border-stone-200">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-stone-600 mb-2">
                    No individual appointments found
                  </h3>
                  <p className="text-sm text-stone-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'You haven\'t created any individual trial appointments yet'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredItems.map((item) => (
                <ModernStudentCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onContact={handleContact}
                  onScheduleFollowUp={handleScheduleFollowUp}
                  onCreatePaymentLink={setPaymentLinkItem}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="families" className="space-y-4">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Family Groups Management</CardTitle>
              <CardDescription>
                Manage family trial sessions and group bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {familyGroups.length === 0 ? (
                <div className="text-center py-8 text-stone-600">
                  <p>No family groups found.</p>
                  <p className="text-sm">Family bookings will appear here once created.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {familyGroups.map((family) => (
                    <FamilyCard
                      key={family.id}
                      family={family}
                      onContact={() => handleFamilyContact(family)}
                      onEdit={() => {
                        toast.info('Edit family functionality coming soon');
                      }}
                      onStatusChange={(status) => updateFamilyStatus(family.id, status)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followup" className="space-y-4">
          <FollowUpManagementTab />
        </TabsContent>
      </Tabs>

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
  );
};

export default SalesTrialAppointments;
