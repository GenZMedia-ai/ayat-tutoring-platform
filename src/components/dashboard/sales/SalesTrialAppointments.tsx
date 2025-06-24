
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Calendar, CreditCard } from 'lucide-react';
import { useMixedStudentData, MixedStudentItem } from '@/hooks/useMixedStudentData';
import { useSalesPermissions } from '@/hooks/useSalesPermissions';
import { UnifiedTrialCard } from '@/components/shared/UnifiedTrialCard';
import { StudentEditModal } from '@/components/sales/StudentEditModal';
import { StatusChangeModal } from '@/components/sales/StatusChangeModal';
import { PaymentLinkModal } from '@/components/sales/PaymentLinkModal';
import { FamilyGroup } from '@/types/family';
import { TrialSessionFlowStudent } from '@/types/trial';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const SalesTrialAppointments: React.FC = () => {
  const { items, loading, refetchData } = useMixedStudentData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [editingItem, setEditingItem] = useState<MixedStudentItem | null>(null);
  const [changingStatusItem, setChangingStatusItem] = useState<MixedStudentItem | null>(null);
  const [paymentLinkItem, setPaymentLinkItem] = useState<TrialSessionFlowStudent | FamilyGroup | null>(null);

  // Get date range based on filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        return { from: now, to: now };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { from: yesterday, to: yesterday };
      case 'last7days':
        return { from: subDays(now, 7), to: now };
      case 'thismonth':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'lastmonth':
        const lastMonth = subDays(startOfMonth(now), 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      case 'alltime':
        return { from: new Date('2024-01-01'), to: now };
      default:
        return { from: now, to: now };
    }
  };

  // Filter items based on date, status, teacher, and search
  const filteredItems = items.filter(item => {
    const data = item.data;
    const name = item.type === 'family' 
      ? (data as FamilyGroup).parent_name 
      : (data as TrialSessionFlowStudent).name;
    const uniqueId = item.type === 'family'
      ? (data as FamilyGroup).unique_id
      : (data as TrialSessionFlowStudent).uniqueId;
    
    // Date filtering
    const { from, to } = getDateRange();
    const itemDate = new Date(
      item.type === 'family' 
        ? (data as FamilyGroup).created_at 
        : (data as TrialSessionFlowStudent).createdAt
    );
    const matchesDate = dateFilter === 'alltime' || 
      (itemDate >= from && itemDate <= to);
    
    // Search filtering
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         data.phone.includes(searchTerm);
    
    // Status filtering
    const matchesStatus = statusFilter === 'all' || data.status === statusFilter;
    
    // Teacher filtering (if implemented)
    const matchesTeacher = teacherFilter === 'all'; // Simplified for now
    
    return matchesDate && matchesSearch && matchesStatus && matchesTeacher;
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

  const handleCreatePaymentLink = (item: MixedStudentItem) => {
    setPaymentLinkItem(item.data);
  };

  const isCompletedTrial = (status: string) => {
    return status === 'trial-completed' || status === 'trial-ghosted';
  };

  const getTeacherName = (item: MixedStudentItem) => {
    // This would need to be enhanced to fetch actual teacher names
    return item.type === 'family' 
      ? (item.data as FamilyGroup).assigned_teacher_id || 'Not Assigned'
      : (item.data as TrialSessionFlowStudent).assignedTeacher || 'Not Assigned';
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
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Trial Appointments</h3>
          <p className="text-sm text-muted-foreground">
            Manage all trial sessions across all statuses and create payment links
          </p>
        </div>
        <Button onClick={refetchData} variant="outline" size="sm">
          <Search className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Filter</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="thismonth">This Month</SelectItem>
                  <SelectItem value="lastmonth">Last Month</SelectItem>
                  <SelectItem value="alltime">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Filter</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Teacher Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Teacher Filter</label>
              <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {/* Add teacher options here */}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name or Phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trial Appointments List */}
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
            <Card key={`${item.type}-${item.id}`} className={`${isCompletedTrial(item.data.status) ? 'border-green-200 bg-green-50' : ''}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.type === 'family' ? 'secondary' : 'default'}>
                      {item.type === 'family'
                        ? `Family (${(item.data as FamilyGroup).student_count})`
                        : 'Individual'
                      }
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.data.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    {isCompletedTrial(item.data.status) && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Ready for Payment Link
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">
                  {item.type === 'family' 
                    ? (item.data as FamilyGroup).parent_name 
                    : (item.data as TrialSessionFlowStudent).name
                  }
                </CardTitle>
                <CardDescription>
                  ID: {item.type === 'family'
                    ? (item.data as FamilyGroup).unique_id
                    : (item.data as TrialSessionFlowStudent).uniqueId
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Phone:</span> {item.data.phone}
                  </div>
                  <div>
                    <span className="font-medium">Country:</span> {item.data.country}
                  </div>
                  <div>
                    <span className="font-medium">Platform:</span> {item.data.platform}
                  </div>
                  <div>
                    <span className="font-medium">Teacher:</span> {getTeacherName(item)}
                  </div>
                  {item.type === 'individual' && (
                    <div>
                      <span className="font-medium">Age:</span> {(item.data as TrialSessionFlowStudent).age}
                    </div>
                  )}
                  {(item.data as any).trial_date && (
                    <div>
                      <span className="font-medium">Trial Date:</span> {(item.data as any).trial_date}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleContact(item)}
                  >
                    Contact
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingItem(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setChangingStatusItem(item)}
                  >
                    Change Status
                  </Button>
                  {isCompletedTrial(item.data.status) && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleCreatePaymentLink(item)}
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      Create Payment Link
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
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
          student={paymentLinkItem}
          open={!!paymentLinkItem}
          onClose={() => setPaymentLinkItem(null)}
          onSuccess={() => {
            setPaymentLinkItem(null);
            refetchData();
          }}
        />
      )}
    </div>
  );
};

export default SalesTrialAppointments;
