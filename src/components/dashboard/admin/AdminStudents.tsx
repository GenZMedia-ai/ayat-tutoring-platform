
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  GraduationCap, 
  Users, 
  DollarSign, 
  Calendar,
  Phone,
  MessageSquare,
  UserCheck,
  Package,
  TrendingUp,
  Clock,
  RefreshCw,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StudentRecord {
  id: string;
  uniqueId: string;
  name: string;
  age: number;
  phone: string;
  country: string;
  status: string;
  assignedTeacher?: string;
  assignedSalesAgent: string;
  createdAt: string;
  paymentData?: any;
  sessions?: any[];
  familyGroupId?: string;
}

const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [salesAgentFilter, setSalesAgentFilter] = useState<string>('all');

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          sessions:sessions(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStudents();
  }, []);

  // Advanced filtering with god-mode access
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.phone.includes(searchTerm) ||
                         student.country.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesTeacher = teacherFilter === 'all' || student.assignedTeacher === teacherFilter;
    const matchesSalesAgent = salesAgentFilter === 'all' || student.assignedSalesAgent === salesAgentFilter;
    
    return matchesSearch && matchesStatus && matchesTeacher && matchesSalesAgent;
  });

  const getStatusCount = (status: string) => {
    if (status === 'all') return students.length;
    return students.filter(s => s.status === status).length;
  };

  const statusOptions = [
    { value: 'all', label: 'All Students', count: students.length },
    { value: 'pending', label: 'Pending', count: getStatusCount('pending') },
    { value: 'confirmed', label: 'Confirmed', count: getStatusCount('confirmed') },
    { value: 'trial-completed', label: 'Trial Completed', count: getStatusCount('trial-completed') },
    { value: 'awaiting-payment', label: 'Awaiting Payment', count: getStatusCount('awaiting-payment') },
    { value: 'paid', label: 'Paid', count: getStatusCount('paid') },
    { value: 'active', label: 'Active', count: getStatusCount('active') },
    { value: 'expired', label: 'Expired', count: getStatusCount('expired') },
    { value: 'cancelled', label: 'Cancelled', count: getStatusCount('cancelled') },
    { value: 'dropped', label: 'Dropped', count: getStatusCount('dropped') }
  ];

  const handleBulkOperation = (operation: string) => {
    toast.info(`Bulk ${operation} operation - Feature coming soon`);
  };

  const handleContact = (student: StudentRecord) => {
    const whatsappUrl = `https://wa.me/${student.phone.replace(/[^0-9]/g, '')}?text=Hello ${student.name}! This is from the administrative team.`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paid': return 'default';
      case 'expired': return 'destructive';
      case 'cancelled': return 'destructive';
      case 'dropped': return 'destructive';
      case 'awaiting-payment': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading all student records...</p>
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
            <GraduationCap className="h-5 w-5 text-primary" />
            Ultimate Student Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Complete oversight and control of all students across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleBulkOperation('export')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={fetchAllStudents} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Student Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {students.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Students</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {getStatusCount('active')}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getStatusCount('paid')}
              </div>
              <div className="text-sm text-muted-foreground">Paid</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {getStatusCount('awaiting-payment')}
              </div>
              <div className="text-sm text-muted-foreground">Awaiting Payment</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {getStatusCount('expired')}
              </div>
              <div className="text-sm text-muted-foreground">Expired</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {getStatusCount('cancelled') + getStatusCount('dropped')}
              </div>
              <div className="text-sm text-muted-foreground">Inactive</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-students" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all-students">All Students</TabsTrigger>
          <TabsTrigger value="active-students">Active Students</TabsTrigger>
          <TabsTrigger value="analytics">Student Analytics</TabsTrigger>
          <TabsTrigger value="bulk-operations">Bulk Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="all-students" className="space-y-4">
          {/* Advanced Filtering */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
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

          {/* Students Grid */}
          {filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No students found
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'No student records found in the system'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="dashboard-card hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{student.name}</CardTitle>
                        <CardDescription className="text-sm">
                          ID: {student.uniqueId} • Age: {student.age}
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusBadgeVariant(student.status)}>
                        {student.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Country:</span>
                        <span>{student.country}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-mono text-xs">{student.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Teacher:</span>
                        <span>{student.assignedTeacher || 'Not assigned'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sales Agent:</span>
                        <span>{student.assignedSalesAgent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(student.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleContact(student)}
                        className="flex-1"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toast.info('Edit student feature coming soon')}
                        className="flex-1"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active-students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Students Dashboard
              </CardTitle>
              <CardDescription>
                Students with active sessions and ongoing packages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4" />
                <p>Active students management coming soon</p>
                <p className="text-sm">This will show detailed active student information</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Student Journey Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Trial → Paid Conversion</span>
                    <Badge variant="secondary">
                      {getStatusCount('trial-completed') > 0 ? 
                        Math.round((getStatusCount('paid') / getStatusCount('trial-completed')) * 100) : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payment → Active Rate</span>
                    <Badge variant="secondary">
                      {getStatusCount('paid') > 0 ? 
                        Math.round((getStatusCount('active') / getStatusCount('paid')) * 100) : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Student Retention Rate</span>
                    <Badge variant="default">
                      {students.length > 0 ? 
                        Math.round(((getStatusCount('active') + getStatusCount('paid')) / students.length) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Paid Students</span>
                    <Badge variant="default">{getStatusCount('paid')}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Students</span>
                    <Badge variant="default">{getStatusCount('active')}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Potential Revenue Lost</span>
                    <Badge variant="destructive">{getStatusCount('dropped') + getStatusCount('expired')}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk-operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Bulk Student Operations
              </CardTitle>
              <CardDescription>
                Perform mass operations on selected students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  onClick={() => handleBulkOperation('status-update')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <UserCheck className="h-6 w-6 mb-2" />
                  Bulk Status Update
                </Button>
                <Button 
                  onClick={() => handleBulkOperation('reassign')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <Users className="h-6 w-6 mb-2" />
                  Bulk Reassignment
                </Button>
                <Button 
                  onClick={() => handleBulkOperation('notify')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <MessageSquare className="h-6 w-6 mb-2" />
                  Bulk Notifications
                </Button>
                <Button 
                  onClick={() => handleBulkOperation('extend-package')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <Package className="h-6 w-6 mb-2" />
                  Extend Packages
                </Button>
                <Button 
                  onClick={() => handleBulkOperation('contact')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <Phone className="h-6 w-6 mb-2" />
                  Bulk Contact
                </Button>
                <Button 
                  onClick={() => handleBulkOperation('export')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <Download className="h-6 w-6 mb-2" />
                  Export Selected
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminStudents;
