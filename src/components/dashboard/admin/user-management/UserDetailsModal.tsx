
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, Clock, Phone, Mail, Globe, MessageSquare } from 'lucide-react';

interface UserDetailsModalProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    role: string;
    teacher_type?: string;
    language: string;
    status: string;
    created_at: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onApprove?: (userId: string) => void;
  onReject?: (userId: string, reason: string) => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  open,
  onClose,
  onApprove,
  onReject
}) => {
  if (!user) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'sales': return 'bg-blue-100 text-blue-800';
      case 'supervisor': return 'bg-orange-100 text-orange-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getWaitingTime = () => {
    const created = new Date(user.created_at);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Complete information for {user.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{user.full_name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-sm">{user.email}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-sm">{user.phone}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Language</label>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span>{user.language === 'ar' ? 'Arabic' : 'English'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Role and Status Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <div className="flex items-center gap-2">
                <Badge className={getRoleColor(user.role)}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
                {user.teacher_type && (
                  <Badge variant="outline" className="text-xs">
                    {user.teacher_type}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge className={getStatusColor(user.status)}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Time Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{formatDate(user.created_at)}</span>
              </div>
            </div>

            {user.status === 'pending' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Waiting Time</label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-600">
                    {getWaitingTime()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions for Pending Users */}
          {user.status === 'pending' && (onApprove || onReject) && (
            <>
              <Separator />
              <div className="flex items-center justify-end gap-3">
                {onReject && (
                  <Button
                    variant="destructive"
                    onClick={() => onReject(user.id, 'Manual rejection from user details')}
                  >
                    Reject User
                  </Button>
                )}
                {onApprove && (
                  <Button
                    onClick={() => onApprove(user.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve User
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Contact Actions */}
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Contact Actions</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const whatsappUrl = `https://wa.me/${user.phone.replace(/[^0-9]/g, '')}?text=Hello ${user.full_name}! This is regarding your registration with Ayat w Bian.`;
                  window.open(whatsappUrl, '_blank');
                }}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  window.open(`mailto:${user.email}?subject=Registration Update - Ayat w Bian`, '_blank');
                }}
              >
                <Mail className="w-4 h-4 mr-1" />
                Email
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
