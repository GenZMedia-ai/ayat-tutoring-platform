
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  TrendingUp, 
  UserCheck,
  Clock,
  Phone,
  MessageSquare,
  Settings,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useMixedStudentData } from '@/hooks/useMixedStudentData';
import { useFamilyGroups } from '@/hooks/useFamilyGroups';
import { UnifiedTrialCard } from '@/components/shared/UnifiedTrialCard';
import { FamilyCard } from '@/components/family/FamilyCard';
import { toast } from 'sonner';

const AdminTrials: React.FC = () => {
  const { items, loading, refetchData, getStatsCount } = useMixedStudentData();
  const { familyGroups, loading: familyLoading, fetchFamilyGroups } = useFamilyGroups();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [salesAgentFilter, setSalesAgentFilter] = useState<string>('all');

  // Filter trials with admin god-mode access
  const filteredItems = items.filter(item => {
    const data = item.data;
    const name = item.type === 'family' 
      ? (data as any).parent_name 
      : (data as any).name;
    const uniqueId = item.type === 'family'
      ? (data as any).unique_id
      : (data as any).uniqueId;
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         data.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || data.status === statusFilter;
    const matchesTeacher = teacherFilter === 'all' || data.assignedTeacher === teacherFilter;
    const matchesSalesAgent = salesAgentFilter === 'all' || data.assignedSalesAgent === salesAgentFilter;
    
    return matchesSearch && matchesStatus && matchesTeacher && matchesSalesAgent;
  });

  const statusOptions = [
    { value: 'all', label: 'All Statuses', count: items.length },
    { value: 'pending', label: 'Pending', count: getStatsCount('pending') },
    { value: 'confirmed', label: 'Confirmed', count: getStatsCount('confirmed') },
    { value: 'trial-completed', label: 'Trial Completed', count: getStatsCount('trial-completed') },
    { value: 'trial-ghosted', label: 'Trial Ghosted', count: getStatsCount('trial-ghosted') },
    { value: 'awaiting-payment', label: 'Awaiting Payment', count: getStatsCount('awaiting-payment') },
    { value: 'paid', label: 'Paid', count: getStatsCount('paid') },
    { value: 'active', label: 'Active', count: getStatsCount('active') },
    { value: 'expired', label: 'Expired', count: getStatsCount('expired') },
    { value: 'cancelled', label: 'Cancelled', count: getStatsCount('cancelled') },
    { value: 'dropped', label: 'Dropped', count: getStatsCount('dropped') }
  ];

  const handleBulkStatusUpdate = async (newStatus: string) => {
    toast.info(`Bulk status update to ${newStatus} - Feature coming soon`);
  };

  const handleBulkReassignment = async () => {
    toast.info('Bulk reassignment feature - Coming soon');
  };

  const handleContact = (item: any) => {
    const phone = item.data.phone;
    const name = item.type === 'family' 
      ? item.data.parent_name 
      : item.data.name;
    
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Hello ${name}! This is from the administrative team regarding your trial session.`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading || familyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading all trial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ultimate Admin Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Ultimate Trial Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Complete oversight and control of all trial sessions across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleBulkReassignment} variant="outline" size="sm">
            <UserCheck className="h-4 w-4 mr-2" />
            Bulk Reassign
          </Button>
          <Button onClick={() => {
            refetchData();
            fetchFamilyGroups();
          }} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Admin Analytics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
              <div className="text-2xl font-bold text-red-600">
                {getStatsCount('trial-ghosted')}
              </div>
              <div className="text-sm text-muted-foreground">Ghosted</div>
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
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {familyGroups.length}
              </div>
              <div className="text-sm text-muted-foreground">Family Groups</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="individual">Individual Trials</TabsTrigger>
          <TabsTrigger value="families">Family Groups</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          <TabsTrigger value="bulk-actions">Bulk Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          {/* Advanced Filtering */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} ({option.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Teachers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teachers</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={salesAgentFilter} onValueChange={setSalesAgentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sales Agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sales Agents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Individual Trials Grid */}
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No trials found
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'No trial appointments found in the system'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <UnifiedTrialCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onEdit={() => toast.info('Admin edit modal coming soon')}
                  onStatusChange={() => toast.info('Admin status change modal coming soon')}
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
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Family Groups Management
              </CardTitle>
              <CardDescription>
                Complete oversight of family trial sessions and group bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {familyGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4" />
                  <p>No family groups found.</p>
                  <p className="text-sm">Family bookings will appear here once created.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {familyGroups.map((family) => (
                    <FamilyCard
                      key={family.id}
                      family={family}
                      onContact={() => handleContact({ data: family, type: 'family' })}
                      onEdit={() => toast.info('Admin family edit coming soon')}
                      onStatusChange={(status) => toast.info('Admin family status change coming soon')}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Conversion Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Trial → Completed</span>
                    <Badge variant="secondary">
                      {getStatsCount('trial-completed')} / {getStatsCount('confirmed')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Completed → Payment</span>
                    <Badge variant="secondary">
                      {getStatsCount('awaiting-payment')} / {getStatsCount('trial-completed')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payment → Active</span>
                    <Badge variant="secondary">
                      {getStatsCount('paid')} / {getStatsCount('awaiting-payment')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Overall Conversion Rate</span>
                    <Badge variant="default">
                      {items.length > 0 ? Math.round((getStatsCount('paid') / items.length) * 100) : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Trial Completion Rate</span>
                    <Badge variant="secondary">
                      {getStatsCount('confirmed') > 0 ? Math.round((getStatsCount('trial-completed') / getStatsCount('confirmed')) * 100) : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>No-Show Rate</span>
                    <Badge variant="destructive">
                      {getStatsCount('confirmed') > 0 ? Math.round((getStatsCount('trial-ghosted') / getStatsCount('confirmed')) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk-actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Bulk Operations
              </CardTitle>
              <CardDescription>
                Perform mass operations on selected trials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  onClick={() => handleBulkStatusUpdate('confirmed')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <UserCheck className="h-6 w-6 mb-2" />
                  Bulk Confirm Trials
                </Button>
                <Button 
                  onClick={() => handleBulkStatusUpdate('awaiting-payment')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <Clock className="h-6 w-6 mb-2" />
                  Bulk Move to Payment
                </Button>
                <Button 
                  onClick={handleBulkReassignment}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <Users className="h-6 w-6 mb-2" />
                  Bulk Reassign
                </Button>
                <Button 
                  onClick={() => toast.info('Bulk notification feature coming soon')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <MessageSquare className="h-6 w-6 mb-2" />
                  Bulk Notify
                </Button>
                <Button 
                  onClick={() => toast.info('Bulk WhatsApp contact coming soon')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <Phone className="h-6 w-6 mb-2" />
                  Bulk WhatsApp
                </Button>
                <Button 
                  onClick={() => toast.info('Export feature coming soon')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTrials;
