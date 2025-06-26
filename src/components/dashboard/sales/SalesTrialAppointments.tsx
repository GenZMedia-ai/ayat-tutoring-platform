
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Calendar, AlertCircle } from 'lucide-react';
import { useMixedStudentData, MixedStudentItem } from '@/hooks/useMixedStudentData';
import { useFamilyGroups } from '@/hooks/useFamilyGroups';
import { EnhancedUnifiedTrialCard } from '@/components/shared/EnhancedUnifiedTrialCard';
import { StudentEditModal } from '@/components/sales/StudentEditModal';
import { StatusChangeModal } from '@/components/sales/StatusChangeModal';
import { PaymentLinkModal } from '@/components/sales/PaymentLinkModal';
import { PaymentLinkSuccessModal } from '@/components/sales/PaymentLinkSuccessModal';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudent } from '@/types/trial';
import { toast } from 'sonner';

const SalesTrialAppointments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<MixedStudentItem | null>(null);
  const [changingStatusItem, setChangingStatusItem] = useState<MixedStudentItem | null>(null);
  const [paymentLinkItem, setPaymentLinkItem] = useState<MixedStudentItem | null>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);

  // Wrap data fetching in error handling
  const {
    items = [],
    loading: itemsLoading = false,
    refetchData,
    getStatsCount
  } = useMixedStudentData() || {};

  const {
    familyGroups = [],
    loading: familyLoading = false,
    fetchFamilyGroups
  } = useFamilyGroups() || {};

  const loading = itemsLoading || familyLoading;

  // Combine individual items and family groups with error handling
  const getCombinedItems = () => {
    try {
      const validItems = Array.isArray(items) ? items : [];
      const validFamilyGroups = Array.isArray(familyGroups) ? familyGroups : [];
      
      return [
        ...validItems,
        ...validFamilyGroups.map(family => ({
          type: 'family' as const,
          id: family.id,
          data: family
        }))
      ];
    } catch (error) {
      console.error('Error combining items:', error);
      return [];
    }
  };

  const combinedItems = getCombinedItems();

  // Filter combined items with error handling
  const getFilteredItems = () => {
    try {
      return combinedItems.filter(item => {
        if (!item || !item.data) return false;
        
        const data = item.data;
        const name = item.type === 'family' 
          ? (data as FamilyGroup).parent_name 
          : (data as TrialSessionFlowStudent).name;
        const uniqueId = item.type === 'family'
          ? (data as FamilyGroup).unique_id
          : (data as TrialSessionFlowStudent).uniqueId;
        
        const searchStr = searchTerm.toLowerCase();
        const matchesSearch = !searchStr || 
          (name && name.toLowerCase().includes(searchStr)) ||
          (uniqueId && uniqueId.toLowerCase().includes(searchStr)) ||
          (data.phone && data.phone.includes(searchTerm));
        
        const matchesStatus = statusFilter === 'all' || data.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      });
    } catch (error) {
      console.error('Error filtering items:', error);
      return [];
    }
  };

  const filteredItems = getFilteredItems();

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'trial-completed', label: 'Trial Completed' },
    { value: 'trial-ghosted', label: 'Trial Ghosted' },
    { value: 'awaiting-payment', label: 'Awaiting Payment' },
    { value: 'paid', label: 'Paid' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'dropped', label: 'Dropped' }
  ];

  const handleContact = (item: MixedStudentItem) => {
    try {
      if (!item || !item.data) {
        toast.error('Invalid student data');
        return;
      }

      const phone = item.data.phone;
      const name = item.type === 'family' 
        ? (item.data as FamilyGroup).parent_name 
        : (item.data as TrialSessionFlowStudent).name;
      
      if (!phone) {
        toast.error('Phone number not available');
        return;
      }
      
      const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Hello ${name}! This is regarding your trial session booking.`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error handling contact:', error);
      toast.error('Failed to open WhatsApp');
    }
  };

  const handlePaymentLinkSuccess = (paymentData: any, studentData: any) => {
    try {
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
      refetchData?.();
      fetchFamilyGroups?.();
    } catch (error) {
      console.error('Error handling payment link success:', error);
      toast.error('Error processing payment link');
    }
  };

  const handleRefresh = () => {
    try {
      refetchData?.();
      fetchFamilyGroups?.();
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    }
  };

  const getSafeStatsCount = (status: string) => {
    try {
      return getStatsCount ? getStatsCount(status) : 0;
    } catch (error) {
      console.warn('Error getting stats count:', error);
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading trial appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Trial Appointments</h3>
            <p className="text-sm text-muted-foreground">
              Manage all trial sessions, payments, and follow-ups
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Search and Filter Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} ({option.value === 'all' ? filteredItems.length : getSafeStatsCount(option.value)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {getSafeStatsCount('pending')}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {getSafeStatsCount('confirmed')}
                </div>
                <div className="text-sm text-muted-foreground">Confirmed</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {getSafeStatsCount('trial-completed')}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {getSafeStatsCount('awaiting-payment')}
                </div>
                <div className="text-sm text-muted-foreground">Awaiting Payment</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Trials List */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No trial appointments found
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'You haven\'t created any trial appointments yet'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredItems.map((item) => (
              <ErrorBoundary key={`${item.type}-${item.id}`}>
                <EnhancedUnifiedTrialCard
                  item={item}
                  onEdit={setEditingItem}
                  onStatusChange={setChangingStatusItem}
                  onContact={handleContact}
                  onCreatePaymentLink={setPaymentLinkItem}
                  onRefresh={handleRefresh}
                />
              </ErrorBoundary>
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
              handleRefresh();
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
              handleRefresh();
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
      </div>
    </ErrorBoundary>
  );
};

export default SalesTrialAppointments;
