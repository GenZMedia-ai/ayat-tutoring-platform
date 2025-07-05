
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Clock, User, Phone, MapPin, Video } from 'lucide-react';
import { FamilyGroup } from '@/types/family';

interface FamilyCardProps {
  family: FamilyGroup;
  onContact?: () => void;
  onEdit?: () => void;
  onStatusChange?: (status: string) => void;
  showActions?: boolean;
}

const statusColors = {
  'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
  'trial-completed': 'bg-green-100 text-green-800 border-green-200',
  'trial-ghosted': 'bg-red-100 text-red-800 border-red-200',
  'awaiting-payment': 'bg-purple-100 text-purple-800 border-purple-200',
  'paid': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'active': 'bg-green-100 text-green-800 border-green-200',
  'expired': 'bg-gray-100 text-gray-800 border-gray-200',
  'cancelled': 'bg-red-100 text-red-800 border-red-200',
  'dropped': 'bg-orange-100 text-orange-800 border-orange-200'
};

export const FamilyCard: React.FC<FamilyCardProps> = ({
  family,
  onContact,
  onEdit,
  onStatusChange,
  showActions = true
}) => {
  const formatPhoneNumber = (phone: string) => {
    // Simple phone formatting
    return phone.replace(/^\+/, '');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card className="dashboard-card hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-primary">{family.parent_name}</h3>
              <Badge variant="outline" className="text-xs">
                Family
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="font-medium">{family.student_count}</span>
              <span>students</span>
              <span>•</span>
              <span className="text-xs font-mono">{family.unique_id}</span>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs ${statusColors[family.status] || statusColors.pending}`}
          >
            {family.status.replace('-', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Contact Information */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">+{formatPhoneNumber(family.phone)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{family.country}</span>
          </div>
          <div className="flex items-center gap-2">
            <Video className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground capitalize">{family.platform}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground capitalize">{family.teacher_type}</span>
          </div>
        </div>

        {/* Trial Information - Always rendered for consistent height */}
        <div className={`p-2 bg-muted/50 rounded-lg ${!family.trial_date ? 'invisible h-0 p-0' : ''}`}>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-primary" />
              <span className="font-medium text-primary">{formatDate(family.trial_date)}</span>
            </div>
            {family.trial_time && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-primary" />
                <span className="font-medium text-primary">{formatTime(family.trial_time)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes - Always rendered for consistent height */}
        <div className={`text-xs text-muted-foreground bg-muted/30 p-2 rounded ${!family.notes ? 'invisible h-0 p-0' : ''}`}>
          <span className="font-medium">Notes:</span> {family.notes || 'No notes'}
        </div>

        {/* Invisible placeholder sections to match UnifiedTrialCard structure */}
        {/* Last Contact Information - Always invisible for families */}
        <div className="invisible h-0 p-0">
          <div className="p-3 bg-accent rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-foreground">Last Contact</span>
            </div>
            <p className="text-sm text-muted-foreground">Placeholder</p>
          </div>
        </div>

        {/* Trial Outcome - Always invisible for families */}
        <div className="invisible h-0 p-0">
          <div className="p-3 bg-muted rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-foreground">Trial Outcome</span>
            </div>
            <p className="text-sm">Placeholder</p>
          </div>
        </div>

        {/* Payment Link - Always invisible for families */}
        <div className="invisible h-0 p-0">
          <div className="p-3 bg-accent rounded-lg border border-border">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Payment Link</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Placeholder</p>
          </div>
        </div>

        {/* Follow-up Information - Always invisible for families */}
        <div className="invisible h-0 p-0">
          <div className="p-3 bg-muted rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-foreground">Pending Follow-up</span>
            </div>
            <p className="text-sm text-muted-foreground">Placeholder</p>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            {onContact && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs"
                onClick={onContact}
              >
                Contact Family
              </Button>
            )}
            {onEdit && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs"
                onClick={onEdit}
              >
                Edit
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
