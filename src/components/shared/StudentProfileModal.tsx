
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
import { 
  User, 
  Calendar, 
  Phone, 
  MapPin, 
  Video,
  CreditCard,
  BookOpen,
  Timeline
} from 'lucide-react';
import { useStudentJourneyNotes } from '@/hooks/useStudentJourneyNotes';
import { StudentNotesDisplay } from './StudentNotesDisplay';
import { format } from 'date-fns';

interface StudentProfileModalProps {
  student: any;
  open: boolean;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  open,
  onClose
}) => {
  const { journeyData, loading } = useStudentJourneyNotes(student?.id);

  if (!student) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-orange-100 text-orange-800', label: 'Pending' },
      'confirmed': { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      'trial-completed': { color: 'bg-green-100 text-green-800', label: 'Trial Completed' },
      'trial-ghosted': { color: 'bg-red-100 text-red-800', label: 'Trial Ghosted' },
      'awaiting-payment': { color: 'bg-purple-100 text-purple-800', label: 'Awaiting Payment' },
      'paid': { color: 'bg-emerald-100 text-emerald-800', label: 'Paid' },
      'active': { color: 'bg-cyan-100 text-cyan-800', label: 'Active' },
      'expired': { color: 'bg-gray-100 text-gray-800', label: 'Expired' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="h-5 w-5" />
            {student.name}
            {getStatusBadge(student.status)}
          </DialogTitle>
          <DialogDescription>
            Complete student profile and journey history
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Student Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student ID:</span>
                  <span className="font-mono">{student.uniqueId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age:</span>
                  <span>{student.age}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parent:</span>
                  <span>{student.parentName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Country:</span>
                  <span>{student.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="capitalize">{student.platform}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Trial Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trial Date:</span>
                  <span>{student.trialDate ? format(new Date(student.trialDate), 'MMM dd, yyyy') : 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trial Time:</span>
                  <span>{student.trialTime || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teacher Type:</span>
                  <span className="capitalize">{student.teacherType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{format(new Date(student.createdAt), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          {(student.status === 'paid' || student.status === 'active' || student.status === 'expired') && (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Package:</span>
                    <span>{student.packageName || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sessions:</span>
                    <span>{student.packageSessionCount || 8}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span>{student.paymentCurrency} {student.paymentAmount / 100}</span>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Status Timeline */}
          {journeyData && journeyData.statusHistory.length > 0 && (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Timeline className="h-4 w-4" />
                  Status Timeline
                </h3>
                <div className="space-y-3">
                  {journeyData.statusHistory.map((history, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(history.status)}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(history.changedAt), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        {history.notes && (
                          <p className="text-sm text-muted-foreground">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Complete Journey Notes */}
          {!loading && journeyData && journeyData.notes.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Complete Journey History
              </h3>
              <StudentNotesDisplay 
                notes={journeyData.notes}
                status={student.status}
                compact={false}
                showTitle={false}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
