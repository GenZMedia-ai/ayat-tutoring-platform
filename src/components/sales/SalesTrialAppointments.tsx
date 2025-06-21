
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Calendar } from 'lucide-react';
import { useMixedStudentData, MixedStudentItem } from '@/hooks/useMixedStudentData';
import { useFamilyGroups } from '@/hooks/useFamilyGroups';
import { UnifiedTrialCard } from '@/components/shared/UnifiedTrialCard';
import { FamilyCard } from '@/components/family/FamilyCard';
import { StudentEditModal } from './StudentEditModal';
import { StatusChangeModal } from './StatusChangeModal';
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading trial appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Trial Appointments</h3>
          <p className="text-sm text-muted-foreground">
            Manage individual and family trial sessions
          </p>
        </div>
        <Button onClick={() => {
          refetchData();
          fetchFamilyGroups();
        }} variant="outline" size="sm">
          <Search className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs for Individual vs Family */}
      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Individual Bookings</TabsTrigger>
          <TabsTrigger value="families">Family Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
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
                          {option.label} ({statusFilter === option.value ? filteredItems.length : getStatsCount(option.value)})
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
                    {getStatsCount('pending')}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {getStatsCount('confirmed')}
                  </div>
                  <div className="text-sm text-muted-foreground">Confirmed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {getStatsCount('trial-completed')}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {getStatsCount('awaiting-payment')}
                  </div>
                  <div className="text-sm text-muted-foreground">Awaiting Payment</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Individual Trials List */}
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No individual appointments found
                  </h3>
                  <p className="text-sm text-muted-foreground">
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
                <div className="text-center py-8 text-muted-foreground">
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
