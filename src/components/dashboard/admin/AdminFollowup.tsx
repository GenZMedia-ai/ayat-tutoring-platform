
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Users,
  UserCheck,
  MessageCircle,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const AdminFollowup: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  // Mock data - in real implementation, this would come from a hook
  const followUps = [
    {
      id: '1',
      studentName: 'Ahmed Hassan',
      uniqueId: 'AH001',
      status: 'trial-completed',
      assignedAgent: 'Sarah Johnson',
      lastContact: '2024-06-20T10:00:00Z',
      scheduledFollowup: '2024-06-22T15:00:00Z',
      priority: 'high',
      notes: 'Very interested in 8-session package. Parent asking about schedule flexibility.',
      contactAttempts: 2,
      daysSinceContact: 2
    },
    {
      id: '2',
      studentName: 'Fatima Al-Rashid',
      uniqueId: 'FAR002',
      status: 'trial-completed',
      assignedAgent: 'Mike Chen',
      lastContact: '2024-06-18T14:30:00Z',
      scheduledFollowup: '2024-06-20T10:00:00Z',
      priority: 'urgent',
      notes: 'Payment link sent but not clicked. Need to follow up urgently.',
      contactAttempts: 4,
      daysSinceContact: 4
    },
    {
      id: '3',
      studentName: 'Omar Khalil',
      uniqueId: 'OK003',
      status: 'trial-ghosted',
      assignedAgent: 'Lisa Wang',
      lastContact: '2024-06-19T16:20:00Z',
      scheduledFollowup: '2024-06-25T11:00:00Z',
      priority: 'medium',
      notes: 'Missed trial session. Attempting to reschedule.',
      contactAttempts: 1,
      daysSinceContact: 3
    }
  ];

  const salesAgents = ['Sarah Johnson', 'Mike Chen', 'Lisa Wang', 'Ahmed Ali'];

  const filteredFollowUps = followUps.filter(followup => {
    const matchesSearch = followup.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         followup.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         followup.assignedAgent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || followup.status === statusFilter;
    const matchesAgent = agentFilter === 'all' || followup.assignedAgent === agentFilter;
    const matchesUrgency = urgencyFilter === 'all' || followup.priority === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesAgent && matchesUrgency;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'trial-completed': { color: 'bg-green-100 text-green-800', label: 'Trial Completed' },
      'trial-ghosted': { color: 'bg-red-100 text-red-800', label: 'Trial Ghosted' },
      'awaiting-payment': { color: 'bg-purple-100 text-purple-800', label: 'Awaiting Payment' }
    };
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { color: string; icon: any }> = {
      'urgent': { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      'high': { color: 'bg-orange-100 text-orange-800', icon: Clock },
      'medium': { color: 'bg-yellow-100 text-yellow-800', icon: CheckCircle }
    };
    const config = priorityConfig[priority] || { color: 'bg-gray-100 text-gray-800', icon: CheckCircle };
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const isOverdue = (scheduledDate: string) => {
    return new Date(scheduledDate) < new Date();
  };

  const stats = {
    totalFollowUps: followUps.length,
    overdueFollowUps: followUps.filter(f => isOverdue(f.scheduledFollowup)).length,
    urgentFollowUps: followUps.filter(f => f.priority === 'urgent').length,
    avgContactAttempts: (followUps.reduce((sum, f) => sum + f.contactAttempts, 0) / followUps.length).toFixed(1)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Follow-up Management</h3>
          <p className="text-sm text-muted-foreground">
            Monitor and manage all follow-ups across sales team
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Bulk Follow-up
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Follow-ups</p>
                <p className="text-2xl font-bold">{stats.totalFollowUps}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdueFollowUps}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold text-orange-600">{stats.urgentFollowUps}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Attempts</p>
                <p className="text-2xl font-bold">{stats.avgContactAttempts}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, ID, or agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="trial-completed">Trial Completed</SelectItem>
                  <SelectItem value="trial-ghosted">Trial Ghosted</SelectItem>
                  <SelectItem value="awaiting-payment">Awaiting Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-40">
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-40">
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {salesAgents.map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Follow-ups ({filteredFollowUps.length})</CardTitle>
          <CardDescription>
            All follow-ups with admin reassignment capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFollowUps.map((followup) => (
              <div key={followup.id} className={`border rounded-lg p-4 space-y-3 ${isOverdue(followup.scheduledFollowup) ? 'border-red-200 bg-red-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{followup.studentName}</h4>
                      {getStatusBadge(followup.status)}
                      {getPriorityBadge(followup.priority)}
                      {isOverdue(followup.scheduledFollowup) && (
                        <Badge className="bg-red-100 text-red-800 border-0">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {followup.uniqueId} • Assigned to {followup.assignedAgent}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">
                      {followup.contactAttempts} contact attempts
                    </p>
                    <p className="text-muted-foreground">
                      {followup.daysSinceContact} days since last contact
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Last Contact:</span>{' '}
                    {format(new Date(followup.lastContact), 'MMM dd, yyyy HH:mm')}
                  </div>
                  <div className={isOverdue(followup.scheduledFollowup) ? 'text-red-600 font-medium' : ''}>
                    <span className="font-medium">Scheduled Follow-up:</span>{' '}
                    {format(new Date(followup.scheduledFollowup), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>

                {followup.notes && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Notes:</strong> {followup.notes}
                    </p>
                  </div>
                )}

                {/* Admin Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Student
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Reschedule
                  </Button>
                  <Button variant="outline" size="sm">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Reassign Agent
                  </Button>
                  <Button variant="outline" size="sm">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFollowup;
