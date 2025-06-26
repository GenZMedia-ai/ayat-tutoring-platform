
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Shield, User, UserPlus, UserMinus, Code, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  user_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  old_values: any;
  new_values: any;
  metadata: any;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

const AuditTrail: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');

  // Fetch audit logs with user details
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async (): Promise<AuditLog[]> => {
      console.log('🔍 Fetching audit logs...');
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles!audit_logs_user_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500); // Limit to recent 500 entries

      if (error) {
        console.error('❌ Error fetching audit logs:', error);
        throw error;
      }

      // Transform data to include user details
      const transformedData = data?.map(log => ({
        ...log,
        user_name: log.profiles?.full_name || 'System',
        user_email: log.profiles?.email || 'system@ayatwbian.com'
      })) || [];

      console.log('✅ Audit logs loaded:', transformedData.length);
      return transformedData;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter audit logs
  const filteredLogs = auditLogs?.filter(log => {
    const matchesSearch = 
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action_type === actionFilter;
    const matchesTarget = targetFilter === 'all' || log.target_type === targetFilter;
    
    return matchesSearch && matchesAction && matchesTarget;
  }) || [];

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'user_approved':
        return <UserPlus className="w-4 h-4 text-green-600" />;
      case 'user_rejected':
        return <UserMinus className="w-4 h-4 text-red-600" />;
      case 'invitation_code_used':
        return <Code className="w-4 h-4 text-blue-600" />;
      default:
        return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case 'user_approved':
        return 'default';
      case 'user_rejected':
        return 'destructive';
      case 'invitation_code_used':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTargetType = (targetType: string) => {
    return targetType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const renderLogDetails = (log: AuditLog) => {
    const details = [];
    
    if (log.metadata?.reason) {
      details.push(`Reason: ${log.metadata.reason}`);
    }
    
    if (log.metadata?.user_id) {
      details.push(`Target User: ${log.metadata.user_id.substring(0, 8)}...`);
    }
    
    if (log.metadata?.code) {
      details.push(`Code: ${log.metadata.code}`);
    }
    
    if (log.old_values && log.new_values) {
      const oldStatus = log.old_values.status;
      const newStatus = log.new_values.status;
      if (oldStatus && newStatus && oldStatus !== newStatus) {
        details.push(`${oldStatus} → ${newStatus}`);
      }
    }
    
    return details.length > 0 ? details.join(', ') : 'No additional details';
  };

  if (isLoading) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Audit Trail
          </CardTitle>
          <CardDescription>Loading audit logs...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get unique action types and target types for filters
  const uniqueActions = [...new Set(auditLogs?.map(log => log.action_type) || [])];
  const uniqueTargets = [...new Set(auditLogs?.map(log => log.target_type) || [])];

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Audit Trail
        </CardTitle>
        <CardDescription>
          Track all administrative actions and system changes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, action, or target..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>
                  {formatActionType(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={targetFilter} onValueChange={setTargetFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Targets</SelectItem>
              {uniqueTargets.map(target => (
                <SelectItem key={target} value={target}>
                  {formatTargetType(target)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {auditLogs?.length || 0} audit entries
        </div>

        {/* Audit Logs Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action_type)}
                      <Badge variant={getActionBadgeVariant(log.action_type)}>
                        {formatActionType(log.action_type)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.user_name || 'System'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.user_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {formatTargetType(log.target_type)}
                      </div>
                      {log.target_id && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {log.target_id.substring(0, 8)}...
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground max-w-xs">
                      {renderLogDetails(log)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(log.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'h:mm a')}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || actionFilter !== 'all' || targetFilter !== 'all'
                ? 'No audit logs match your current filters'
                : 'No audit logs found'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditTrail;
