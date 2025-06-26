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
  BookOpen, 
  Calendar, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Settings,
  RefreshCw,
  Download,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionRecord {
  id: string;
  studentId: string;
  sessionNumber: number;
  scheduledDate: string;
  scheduledTime: string;
  actualMinutes?: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  completedAt?: string;
  rescheduleCount: number;
  student?: {
    id: string;
    name: string;
    unique_id: string;
    assigned_teacher_id?: string;
  };
}

const AdminSessions: React.FC = () => {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const fetchAllSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          session_students!inner(
            student:students(
              id,
              name,
              unique_id,
              assigned_teacher_id
            )
          )
        `)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedSessions: SessionRecord[] = (data || []).map(session => ({
        id: session.id,
        studentId: session.session_students[0]?.student?.id || '',
        sessionNumber: session.session_number,
        scheduledDate: session.scheduled_date,
        scheduledTime: session.scheduled_time,
        actualMinutes: session.actual_minutes,
        status: session.status as 'scheduled' | 'completed' | 'cancelled' | 'rescheduled',
        notes: session.notes,
        completedAt: session.completed_at,
        rescheduleCount: session.reschedule_count,
        student: session.session_students[0]?.student ? {
          id: session.session_students[0].student.id,
          name: session.session_students[0].student.name,
          unique_id: session.session_students[0].student.unique_id,
          assigned_teacher_id: session.session_students[0].student.assigned_teacher_id
        } : undefined
      }));
      
      setSessions(transformedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch session data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSessions();
  }, []);

  // Advanced filtering with god-mode access
  const filteredSessions = sessions.filter(session => {
    const studentName = session.student?.name || '';
    const studentId = session.student?.unique_id || '';
    const teacherName = session.student?.assigned_teacher_id || '';
    
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacherName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    const matchesTeacher = teacherFilter === 'all' || session.student?.assigned_teacher_id === teacherFilter;
    
    // Date filtering
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const sessionDate = new Date(session.scheduledDate);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = sessionDate.toDateString() === today.toDateString();
          break;
        case 'week':
          matchesDate = sessionDate >= weekAgo;
          break;
        case 'month':
          matchesDate = sessionDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesTeacher && matchesDate;
  });

  const getStatusCount = (status: string) => {
    if (status === 'all') return sessions.length;
    return sessions.filter(s => s.status === status).length;
  };

  const statusOptions = [
    { value: 'all', label: 'All Sessions', count: sessions.length },
    { value: 'scheduled', label: 'Scheduled', count: getStatusCount('scheduled') },
    { value: 'completed', label: 'Completed', count: getStatusCount('completed') },
    { value: 'cancelled', label: 'Cancelled', count: getStatusCount('cancelled') },
    { value: 'rescheduled', label: 'Rescheduled', count: getStatusCount('rescheduled') }
  ];

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  const handleBulkOperation = (operation: string) => {
    toast.info(`Bulk ${operation} operation - Feature coming soon`);
  };

  const handleSessionAction = (session: SessionRecord, action: string) => {
    toast.info(`${action} session action - Feature coming soon`);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'scheduled': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'rescheduled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'rescheduled': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading all session records...</p>
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
            <BookOpen className="h-5 w-5 text-primary" />
            Ultimate Session Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Complete oversight and control of all sessions across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleBulkOperation('export')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={fetchAllSessions} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Session Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {sessions.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {getStatusCount('completed')}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getStatusCount('scheduled')}
              </div>
              <div className="text-sm text-muted-foreground">Scheduled</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {getStatusCount('rescheduled')}
              </div>
              <div className="text-sm text-muted-foreground">Rescheduled</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {getStatusCount('cancelled')}
              </div>
              <div className="text-sm text-muted-foreground">Cancelled</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {sessions.length > 0 ? Math.round((getStatusCount('completed') / sessions.length) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-sessions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all-sessions">All Sessions</TabsTrigger>
          <TabsTrigger value="today-sessions">Today's Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Session Analytics</TabsTrigger>
          <TabsTrigger value="bulk-operations">Bulk Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="all-sessions" className="space-y-4">
          {/* Advanced Filtering */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sessions..."
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
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sessions Grid */}
          {filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No sessions found
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'No session records found in the system'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions.map((session) => (
                <Card key={session.id} className="dashboard-card hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getStatusIcon(session.status)}
                          Session #{session.sessionNumber}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {session.student?.name} ({session.student?.unique_id})
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusBadgeVariant(session.status)}>
                        {session.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{new Date(session.scheduledDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span>{session.scheduledTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Teacher:</span>
                        <span>{session.student?.assigned_teacher_id || 'Not assigned'}</span>
                      </div>
                      {session.actualMinutes && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{session.actualMinutes} minutes</span>
                        </div>
                      )}
                      {session.rescheduleCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reschedules:</span>
                          <Badge variant="secondary">{session.rescheduleCount}</Badge>
                        </div>
                      )}
                      {session.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <span className="text-muted-foreground">Notes: </span>
                          {session.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleSessionAction(session, 'reschedule')}
                        className="flex-1"
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Reschedule
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSessionAction(session, 'edit')}
                        className="flex-1"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="today-sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Sessions Dashboard
              </CardTitle>
              <CardDescription>
                Real-time overview of today's scheduled sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4" />
                <p>Today's sessions dashboard coming soon</p>
                <p className="text-sm">This will show real-time session status and teacher availability</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Session Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Completion Rate</span>
                    <Badge variant="default">
                      {sessions.length > 0 ? Math.round((getStatusCount('completed') / sessions.length) * 100) : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cancellation Rate</span>
                    <Badge variant="destructive">
                      {sessions.length > 0 ? Math.round((getStatusCount('cancelled') / sessions.length) * 100) : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Reschedule Rate</span>
                    <Badge variant="secondary">
                      {sessions.length > 0 ? Math.round((getStatusCount('rescheduled') / sessions.length) * 100) : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Duration</span>
                    <Badge variant="secondary">
                      {sessions.filter(s => s.actualMinutes).length > 0 ? 
                        Math.round(sessions.filter(s => s.actualMinutes).reduce((sum, s) => sum + (s.actualMinutes || 0), 0) / 
                        sessions.filter(s => s.actualMinutes).length) : 0} min
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Teacher Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4" />
                  <p>Teacher performance analytics coming soon</p>
                  <p className="text-sm">This will show detailed teacher session statistics</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk-operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Bulk Session Operations
              </CardTitle>
              <CardDescription>
                Perform mass operations on selected sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  onClick={() => handleBulkOperation('reschedule')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <Calendar className="h-6 w-6 mb-2" />
                  Bulk Reschedule
                </Button>
                <Button 
                  onClick={() => handleBulkOperation('cancel')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <XCircle className="h-6 w-6 mb-2" />
                  Bulk Cancel
                </Button>
                <Button 
                  onClick={() => handleBulkOperation('reassign')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <UserCheck className="h-6 w-6 mb-2" />
                  Bulk Reassign
                </Button>
                <Button 
                  onClick={() => handleBulkOperation('notify')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <MessageSquare className="h-6 w-6 mb-2" />
                  Bulk Notify
                </Button>
                <Button 
                  onClick={() => handleBulkOperation('complete')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <CheckCircle className="h-6 w-6 mb-2" />
                  Mark Complete
                </Button>
                <Button 
                  onClick={() => handleBulkOperation('export')}
                  variant="outline"
                  className="h-20 flex flex-col"
                >
                  <Download className="h-6 w-6 mb-2" />
                  Export Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSessions;
