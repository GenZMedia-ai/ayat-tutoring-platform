
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Calendar, Users, User, MessageSquare, RefreshCw } from 'lucide-react';
import { useMixedStudentData, MixedStudentItem } from '@/hooks/useMixedStudentData';
import { useFamilyGroups } from '@/hooks/useFamilyGroups';
import { UnifiedTrialCard } from '@/components/shared/UnifiedTrialCard';
import { FamilyCard } from '@/components/family/FamilyCard';
import { StudentEditModal } from '@/components/sales/StudentEditModal';
import { StatusChangeModal } from '@/components/sales/StatusChangeModal';
import { FollowUpManagementTab } from '@/components/sales/FollowUpManagementTab';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudent } from '@/types/trial';
import { toast } from 'sonner';

const SalesTrialAppointments: React.FC = () => {
  const { items, loading, refetchData, getStatsCount } = useMixedStudentData();
  const { familyGroups, loading: familyLoading, fetchFamilyGroups, updateFamilyStatus } = useFamilyGroups();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<MixedStudentItem | null>(null);
  const [changingStatusItem, setChangingStatusItem] = useState<MixedStudentItem | null>(null);

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

  if (loading || familyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400 mx-auto"></div>
          <p className="text-stone-600 mt-2">Loading trial appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-stone-900">Trial Appointments</h3>
          <p className="text-stone-600 mt-1">
            Manage individual and family trial sessions, and process payments
          </p>
        </div>
        <Button onClick={() => {
          refetchData();
          fetchFamilyGroups();
        }} className="modern-button-secondary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Modern Tabs */}
      <Tabs defaultValue="individual" className="space-y-6">
        <TabsList className="modern-pill-tabs grid w-full grid-cols-3">
          <TabsTrigger value="individual" className="modern-pill-tab flex items-center gap-2">
            <User className="h-4 w-4" />
            Individual Bookings
          </TabsTrigger>
          <TabsTrigger value="families" className="modern-pill-tab flex items-center gap-2">
            <Users className="h-4 w-4" />
            Family Groups
          </TabsTrigger>
          <TabsTrigger value="followup" className="modern-pill-tab flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Follow-up & Payment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
          {/* Modern Search and Filter */}
          <Card className="modern-card">
            <CardContent className="modern-card-content pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
                    <Input
                      placeholder="Search by name, ID, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="modern-input pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-64">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="modern-select">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label} ({statusFilter === option.value ? filteredItems.length : getStatsCount(option.value)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modern Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="modern-stats-card">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600">
                  {getStatsCount('pending')}
                </div>
                <div className="text-sm text-stone-600 mt-1">Pending</div>
              </div>
            </div>
            <div className="modern-stats-card">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {getStatsCount('confirmed')}
                </div>
                <div className="text-sm text-stone-600 mt-1">Confirmed</div>
              </div>
            </div>
            <div className="modern-stats-card">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">
                  {getStatsCount('trial-completed')}
                </div>
                <div className="text-sm text-stone-600 mt-1">Completed</div>
              </div>
            </div>
            <div className="modern-stats-card">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {getStatsCount('awaiting-payment')}
                </div>
                <div className="text-sm text-stone-600 mt-1">Awaiting Payment</div>
              </div>
            </div>
          </div>

          {/* Individual Trials List */}
          {filteredItems.length === 0 ? (
            <Card className="modern-card">
              <CardContent className="modern-card-content pt-6">
                <div className="text-center py-12">
                  <div className="modern-icon-circle mx-auto mb-6 bg-stone-100 border-stone-200/40">
                    <Calendar className="h-8 w-8 text-stone-400" />
                  </div>
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
                <UnifiedTrialCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onEdit={setEditingItem}
                  onStatusChange={setChangingStatusItem}
                  onContact={handleContact}
                  onRefresh={refetchData}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="families" className="space-y-6">
          <Card className="modern-card">
            <CardHeader className="modern-card-header">
              <CardTitle className="text-xl font-semibold text-stone-900 flex items-center gap-3">
                <div className="modern-icon-circle bg-blue-50 border-blue-200/40">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                Family Groups Management
              </CardTitle>
              <CardDescription className="text-stone-600">
                Manage family trial sessions and group bookings
              </CardDescription>
            </CardHeader>
            <CardContent className="modern-card-content">
              {familyGroups.length === 0 ? (
                <div className="text-center py-12 text-stone-500">
                  <div className="modern-icon-circle mx-auto mb-6 bg-stone-100 border-stone-200/40">
                    <Users className="h-8 w-8 text-stone-400" />
                  </div>
                  <p className="font-medium mb-2">No family groups found.</p>
                  <p className="text-sm">Family bookings will appear here once created.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        <TabsContent value="followup" className="space-y-6">
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
    </div>
  );
};

export default SalesTrialAppointments;
