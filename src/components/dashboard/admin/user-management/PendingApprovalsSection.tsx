
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Check, X, Clock, AlertCircle } from 'lucide-react';
import { usePendingApprovals } from '@/hooks/usePendingApprovals';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const PendingApprovalsSection: React.FC = () => {
  const { data: pendingUsers, isLoading, approveUser, rejectUser } = usePendingApprovals();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState('');

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(pendingUsers?.map(user => user.id) || []);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to approve');
      return;
    }

    try {
      await Promise.all(selectedUsers.map(userId => approveUser(userId)));
      setSelectedUsers([]);
      toast.success(`Approved ${selectedUsers.length} users`);
    } catch (error) {
      toast.error('Failed to approve some users');
    }
  };

  const handleBulkReject = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to reject');
      return;
    }

    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await Promise.all(selectedUsers.map(userId => rejectUser(userId, rejectReason)));
      setSelectedUsers([]);
      setRejectReason('');
      toast.success(`Rejected ${selectedUsers.length} users`);
    } catch (error) {
      toast.error('Failed to reject some users');
    }
  };

  const getWaitingTime = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'Less than 1 hour';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'sales': return 'bg-blue-100 text-blue-800';
      case 'supervisor': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending User Approvals ({pendingUsers?.length || 0})
          </CardTitle>
          <CardDescription>
            Review and approve new user registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pendingUsers || pendingUsers.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Pending Approvals</h3>
              <p className="text-muted-foreground">
                All user registrations have been processed
              </p>
            </div>
          ) : (
            <>
              {/* Bulk Actions */}
              <div className="flex items-center justify-between mb-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedUsers.length === pendingUsers.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    {selectedUsers.length} of {pendingUsers.length} selected
                  </span>
                </div>
                
                {selectedUsers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleBulkApprove}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Bulk Approve ({selectedUsers.length})
                    </Button>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Rejection reason..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="px-2 py-1 text-sm border rounded"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleBulkReject}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Bulk Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Pending Users Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>User Details</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Waiting Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                          {user.teacher_type && (
                            <Badge variant="outline" className="text-xs">
                              {user.teacher_type}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{user.phone}</div>
                          <div className="text-muted-foreground">{user.language === 'ar' ? 'Arabic' : 'English'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm">{getWaitingTime(user.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {/* TODO: Open user details modal */}}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => approveUser(user.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectUser(user.id, 'Manual rejection')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApprovalsSection;
