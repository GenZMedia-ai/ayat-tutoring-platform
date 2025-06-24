
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Calendar, CreditCard, Phone, Edit, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface TrialStudent {
  id: string;
  unique_id: string;
  name: string;
  age: number;
  phone: string;
  country: string;
  platform: string;
  status: string;
  parent_name?: string;
  trial_date?: string;
  trial_time?: string;
  assigned_teacher_id?: string;
  teacher_name?: string;
  created_at: string;
  family_group_id?: string;
  is_family_member: boolean;
}

interface FamilyGroup {
  id: string;
  unique_id: string;
  parent_name: string;
  phone: string;
  country: string;
  platform: string;
  status: string;
  student_count: number;
  trial_date?: string;
  trial_time?: string;
  assigned_teacher_id?: string;
  teacher_name?: string;
  created_at: string;
}

const SalesTrialAppointments: React.FC = () => {
  const [individualStudents, setIndividualStudents] = useState<TrialStudent[]>([]);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('today');

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

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { from, to } = getDateRange();
      const fromStr = format(from, 'yyyy-MM-dd');
      const toStr = format(to, 'yyyy-MM-dd');

      // Load individual students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          profiles:assigned_teacher_id (
            full_name
          )
        `)
        .eq('assigned_sales_agent_id', user.id)
        .is('family_group_id', null)
        .gte('created_at', fromStr)
        .lte('created_at', toStr + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      // Load family groups
      const { data: families, error: familiesError } = await supabase
        .from('family_groups')
        .select(`
          *,
          profiles:assigned_teacher_id (
            full_name
          )
        `)
        .eq('assigned_sales_agent_id', user.id)
        .gte('created_at', fromStr)
        .lte('created_at', toStr + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (familiesError) throw familiesError;

      // Process individual students
      const processedStudents = (students || []).map(student => ({
        id: student.id,
        unique_id: student.unique_id,
        name: student.name,
        age: student.age,
        phone: student.phone,
        country: student.country,
        platform: student.platform,
        status: student.status,
        parent_name: student.parent_name,
        trial_date: student.trial_date,
        trial_time: student.trial_time,
        assigned_teacher_id: student.assigned_teacher_id,
        teacher_name: (student.profiles as any)?.full_name || 'Not Assigned',
        created_at: student.created_at,
        family_group_id: student.family_group_id,
        is_family_member: false
      }));

      // Process family groups
      const processedFamilies = (families || []).map(family => ({
        id: family.id,
        unique_id: family.unique_id,
        parent_name: family.parent_name,
        phone: family.phone,
        country: family.country,
        platform: family.platform,
        status: family.status,
        student_count: family.student_count,
        trial_date: family.trial_date,
        trial_time: family.trial_time,
        assigned_teacher_id: family.assigned_teacher_id,
        teacher_name: (family.profiles as any)?.full_name || 'Not Assigned',
        created_at: family.created_at
      }));

      setIndividualStudents(processedStudents);
      setFamilyGroups(processedFamilies);
    } catch (error) {
      console.error('Error loading trial appointments:', error);
      toast.error('Failed to load trial appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  // Filter data
  const filteredStudents = individualStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.unique_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredFamilies = familyGroups.filter(family => {
    const matchesSearch = family.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         family.unique_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         family.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || family.status === statusFilter;
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

  const handleContact = (phone: string, name: string) => {
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Hello ${name}! This is regarding your trial session booking.`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'trial-completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'trial-ghosted':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'awaiting-payment':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'dropped':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const canCreatePaymentLink = (status: string) => {
    return status === 'trial-completed' || status === 'trial-ghosted';
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Trial Appointments</h3>
          <p className="text-sm text-muted-foreground">
            Manage all trial sessions and create payment links for completed trials
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name, ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredStudents.filter(s => s.status === 'pending').length + filteredFamilies.filter(f => f.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredStudents.filter(s => s.status === 'confirmed').length + filteredFamilies.filter(f => f.status === 'confirmed').length}
              </div>
              <div className="text-sm text-muted-foreground">Confirmed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredStudents.filter(s => s.status === 'trial-completed').length + filteredFamilies.filter(f => f.status === 'trial-completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {filteredStudents.filter(s => s.status === 'awaiting-payment').length + filteredFamilies.filter(f => f.status === 'awaiting-payment').length}
              </div>
              <div className="text-sm text-muted-foreground">Awaiting Payment</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trial Appointments List */}
      {filteredStudents.length === 0 && filteredFamilies.length === 0 ? (
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
          {/* Individual Students */}
          {filteredStudents.map((student) => (
            <Card key={`student-${student.id}`} className={`${canCreatePaymentLink(student.status) ? 'border-green-200 bg-green-50' : ''}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Individual</Badge>
                    <Badge className={getStatusColor(student.status)}>
                      {student.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    {canCreatePaymentLink(student.status) && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Ready for Payment Link
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{student.name}</CardTitle>
                <CardDescription>ID: {student.unique_id} • Age: {student.age}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Phone:</span> {student.phone}</div>
                  <div><span className="font-medium">Country:</span> {student.country}</div>
                  <div><span className="font-medium">Platform:</span> {student.platform}</div>
                  <div><span className="font-medium">Teacher:</span> {student.teacher_name}</div>
                  {student.parent_name && (
                    <div><span className="font-medium">Parent:</span> {student.parent_name}</div>
                  )}
                  {student.trial_date && student.trial_time && (
                    <div><span className="font-medium">Trial:</span> {student.trial_date} at {student.trial_time}</div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleContact(student.phone, student.name)}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Contact
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {canCreatePaymentLink(student.status) && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      Create Payment Link
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Family Groups */}
          {filteredFamilies.map((family) => (
            <Card key={`family-${family.id}`} className={`${canCreatePaymentLink(family.status) ? 'border-green-200 bg-green-50' : ''}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Family ({family.student_count})</Badge>
                    <Badge className={getStatusColor(family.status)}>
                      {family.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    {canCreatePaymentLink(family.status) && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Ready for Payment Link
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{family.parent_name}</CardTitle>
                <CardDescription>ID: {family.unique_id} • {family.student_count} students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Phone:</span> {family.phone}</div>
                  <div><span className="font-medium">Country:</span> {family.country}</div>
                  <div><span className="font-medium">Platform:</span> {family.platform}</div>
                  <div><span className="font-medium">Teacher:</span> {family.teacher_name}</div>
                  {family.trial_date && family.trial_time && (
                    <div><span className="font-medium">Trial:</span> {family.trial_date} at {family.trial_time}</div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleContact(family.phone, family.parent_name)}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Contact
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {canCreatePaymentLink(family.status) && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
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
    </div>
  );
};

export default SalesTrialAppointments;
