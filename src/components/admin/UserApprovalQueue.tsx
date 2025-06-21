
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';

interface PendingUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  teacherType?: string;
  createdAt: string;
}

interface UserApprovalQueueProps {
  pendingUsers: PendingUser[];
  onApproveUser: (userId: string) => void;
  onRejectUser: (userId: string, reason: string) => void;
  onBulkApprove: (userIds: string[]) => void;
  isProcessing: boolean;
}

const UserApprovalQueue: React.FC<UserApprovalQueueProps> = ({
  pendingUsers,
  onApproveUser,
  onRejectUser,
  onBulkApprove,
  isProcessing
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === pendingUsers.length 
        ? [] 
        : pendingUsers.map(user => user.id)
    );
  };

  const handleRejectUser = (userId: string) => {
    if (rejectionReason.trim()) {
      onRejectUser(userId, rejectionReason);
      setRejectionReason('');
      setRejectingUserId(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'sales': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'supervisor': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Approval Queue ({pendingUsers.length})
        </CardTitle>
        {pendingUsers.length > 0 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSelectAll}
            >
              {selectedUsers.length === pendingUsers.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              size="sm"
              className="ayat-button-primary"
              onClick={() => onBulkApprove(selectedUsers)}
              disabled={selectedUsers.length === 0 || isProcessing}
            >
              Bulk Approve ({selectedUsers.length})
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingUsers.map((user) => (
            <div key={user.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                    className="mt-1"
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{user.fullName}</h4>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                      {user.teacherType && (
                        <Badge variant="outline">
                          {user.teacherType}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Email: {user.email}</div>
                      <div>Phone: {user.phone}</div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Applied: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="ayat-button-primary gap-1"
                    onClick={() => onApproveUser(user.id)}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="w-3 h-3" />
                    Approve
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-red-600 hover:text-red-700"
                        onClick={() => setRejectingUserId(user.id)}
                      >
                        <XCircle className="w-3 h-3" />
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject User Application</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Rejecting application for: <strong>{user.fullName}</strong>
                          </p>
                          <Textarea
                            placeholder="Please provide a reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleRejectUser(user.id)}
                            disabled={!rejectionReason.trim() || isProcessing}
                            variant="destructive"
                            className="flex-1"
                          >
                            Confirm Rejection
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          ))}
          
          {pendingUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No pending user approvals
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserApprovalQueue;
