import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MessageCircle, Calendar, CheckCircle, RefreshCw, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface FollowUpTask {
  id: string;
  student_id: string;
  student_name: string;
  student_phone: string;
  scheduled_date: string;
  reason: string;
  completed: boolean;
  completed_at?: string;
  outcome?: string;
  notes?: string;
  created_at: string;
}

const SalesFollowup: React.FC = () => {
  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('alltime');

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
        return { from: new Date('2024-01-01'), to: new Date('2030-12-31') };
      default:
        return { from: new Date('2024-01-01'), to: new Date('2030-12-31') };
    }
  };

  const createSampleData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: students } = await supabase
        .from('students')
        .select('id, name, phone')
        .eq('assigned_sales_agent_id', user.id)
        .in('status', ['trial-completed', 'trial-ghosted'])
        .limit(3);

      if (!students || students.length === 0) {
        toast.info('No eligible students found for follow-up tasks');
        return;
      }

      const sampleTasks = students.map((student, index) => ({
        student_id: student.id,
        sales_agent_id: user.id,
        scheduled_date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString(),
        reason: index === 0 ? 'trial_followup' : index === 1 ? 'payment_reminder' : 'general_followup',
        completed: false,
        notes: `Follow-up with ${student.name} regarding their trial session`
      }));

      const { error } = await supabase
        .from('sales_followups')
        .insert(sampleTasks);

      if (error) throw error;

      toast.success('Sample follow-up tasks created successfully');
      loadFollowUpTasks();
    } catch (error) {
      console.error('Error creating sample data:', error);
      toast.error('Failed to create sample data');
    }
  };

  const loadFollowUpTasks = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      const { from, to } = getDateRange();
      const fromStr = format(from, 'yyyy-MM-dd');
      const toStr = format(to, 'yyyy-MM-dd');

      console.log('Loading follow-up tasks for date range:', fromStr, 'to', toStr);

      const followupsQuery = dateFilter === 'alltime'
        ? supabase
            .from('sales_followups')
            .select(`
              *,
              students!fk_sales_followups_student (
                name,
                phone
              )
            `)
            .eq('sales_agent_id', user.id)
            .order('scheduled_date', { ascending: true })
        : supabase
            .from('sales_followups')
            .select(`
              *,
              students!fk_sales_followups_student (
                name,
                phone
              )
            `)
            .eq('sales_agent_id', user.id)
            .gte('scheduled_date', fromStr)
            .lte('scheduled_date', toStr + 'T23:59:59')
            .order('scheduled_date', { ascending: true });

      const { data: followups, error } = await followupsQuery;

      if (error) {
        console.error('Error loading follow-up tasks:', error);
        throw new Error(`Failed to load follow-up tasks: ${error.message}`);
      }

      console.log('Loaded follow-up tasks:', followups?.length || 0);

      const tasksWithStudentInfo = (followups || []).map(followup => ({
        ...followup,
        student_name: (followup.students as any)?.name || 'Unknown',
        student_phone: (followup.students as any)?.phone || ''
      }));

      setFollowUpTasks(tasksWithStudentInfo);

      if (tasksWithStudentInfo.length === 0) {
        console.log('No follow-up tasks found for the selected criteria');
      }

    } catch (error) {
      console.error('Error loading follow-up tasks:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load follow-up tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUpTasks();
  }, [dateFilter]);

  const filteredTasks = followUpTasks.filter(task => {
    const matchesSearch = task.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.student_phone.includes(searchTerm);
    return matchesSearch;
  });

  const handleWhatsAppContact = (task: FollowUpTask) => {
    const phone = task.student_phone.replace(/[^0-9]/g, '');
    const message = `Hello ${task.student_name}! This is a follow-up regarding your trial session. I hope you're doing well and would like to discuss your learning journey with us.`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleMarkCompleted = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('sales_followups')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          outcome: 'contacted'
        })
        .eq('id', taskId);

      if (error) throw error;

      setFollowUpTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: true, completed_at: new Date().toISOString(), outcome: 'contacted' }
          : task
      ));

      toast.success('Follow-up marked as completed');
    } catch (error) {
      console.error('Error marking follow-up as completed:', error);
      toast.error('Failed to update follow-up status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading follow-up tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Follow-up Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage scheduled follow-ups and track outreach activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredTasks.filter(t => !t.completed).length} pending tasks
          </Badge>
          <Button onClick={createSampleData} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Sample Data
          </Button>
          <Button onClick={loadFollowUpTasks} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Filter</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alltime">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="thismonth">This Month</SelectItem>
                  <SelectItem value="lastmonth">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Student name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up Tasks List - NEW 2-Column Layout */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No follow-up tasks found
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : dateFilter === 'alltime'
                    ? 'You don\'t have any follow-up tasks yet'
                    : 'No follow-up tasks found for the selected date range. Try "All Time" to see all data.'
                }
              </p>
              <Button onClick={createSampleData} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Sample Follow-up Tasks
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className={`hover:shadow-md transition-shadow ${task.completed ? 'bg-green-50 border-green-200' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={task.completed ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}>
                      {task.completed ? 'COMPLETED' : 'PENDING'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.reason.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(task.scheduled_date), 'MMM dd')}
                  </div>
                </div>
                <CardTitle className="text-lg">{task.student_name}</CardTitle>
                <CardDescription>
                  Phone: {task.student_phone}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.notes && (
                  <div className="text-sm">
                    <span className="font-medium">Notes:</span> 
                    <p className="text-muted-foreground mt-1 line-clamp-2">{task.notes}</p>
                  </div>
                )}

                {task.completed && task.completed_at && (
                  <div className="text-sm text-green-600">
                    <span className="font-medium">Completed:</span> {format(new Date(task.completed_at), 'MMM dd, HH:mm')}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {!task.completed && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleWhatsAppContact(task)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkCompleted(task.id)}
                        className="text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Mark Completed
                      </Button>
                    </>
                  )}
                </div>

                {/* Status Messages */}
                {!task.completed && (
                  <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                    📞 Scheduled follow-up - Contact student to check on their progress
                  </div>
                )}
                {task.completed && (
                  <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                    ✅ Follow-up completed successfully
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SalesFollowup;
