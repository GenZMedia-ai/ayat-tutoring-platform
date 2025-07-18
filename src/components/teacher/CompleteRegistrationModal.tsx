
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCompleteRegistration, SessionData } from '@/hooks/useCompleteRegistration';
import { Calendar, Clock, User, DollarSign, Package } from 'lucide-react';
import { format } from 'date-fns';

interface CompleteRegistrationModalProps {
  student: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CompleteRegistrationModal: React.FC<CompleteRegistrationModalProps> = ({
  student,
  open,
  onClose,
  onSuccess
}) => {
  const { completeRegistration, loading } = useCompleteRegistration();
  const [sessions, setSessions] = useState<SessionData[]>([]);

  // Initialize sessions when student changes - use individual package session count
  React.useEffect(() => {
    if (student) {
      const sessionCount = student.packageSessionCount || 8;
      console.log('🎯 Initializing sessions for student:', {
        name: student.name,
        sessionCount: sessionCount,
        isFamilyMember: student.isFamilyMember
      });
      
      const initialSessions: SessionData[] = Array.from(
        { length: sessionCount },
        (_, index) => ({
          sessionNumber: index + 1,
          date: '',
          time: ''
        })
      );
      setSessions(initialSessions);
    }
  }, [student]);

  const updateSession = (index: number, field: keyof SessionData, value: string) => {
    setSessions(prev => prev.map((session, i) => 
      i === index ? { ...session, [field]: value } : session
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all sessions have date and time
    const invalidSessions = sessions.filter(s => !s.date || !s.time);
    if (invalidSessions.length > 0) {
      alert('Please fill in all session dates and times');
      return;
    }

    const success = await completeRegistration(student.id, sessions);
    if (success) {
      onSuccess();
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Complete Registration - {student.name}
          </DialogTitle>
          <DialogDescription>
            Schedule all {student.packageSessionCount} sessions for this paid student
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enhanced Student Summary with Individual Package Data */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-green-100 text-green-800 border-green-200">PAID</Badge>
              <span className="font-medium">{student.name}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Age {student.age}</span>
              {student.isFamilyMember && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="outline">Family Member</Badge>
                </>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>{student.paymentAmount} {student.paymentCurrency}</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>{student.packageName || 'Custom Package'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className="font-semibold text-primary">
                  {student.packageSessionCount} sessions
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Platform: {student.platform}</span>
              </div>
            </div>
            
            {student.parentName && (
              <div className="text-sm text-muted-foreground mt-2">
                Parent: {student.parentName}
              </div>
            )}
            
            <div className="text-xs text-muted-foreground mt-2">
              Payment ID: {student.uniqueId}
            </div>
          </div>

          {/* Session Scheduling Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Schedule All {student.packageSessionCount} Sessions
              </h3>
              <div className="grid gap-4">
                {sessions.map((session, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Session {session.sessionNumber}</span>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`date-${index}`} className="sr-only">Date</Label>
                      <Input
                        id={`date-${index}`}
                        type="date"
                        value={session.date}
                        onChange={(e) => updateSession(index, 'date', e.target.value)}
                        required
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`time-${index}`} className="sr-only">Time</Label>
                      <Input
                        id={`time-${index}`}
                        type="time"
                        value={session.time}
                        onChange={(e) => updateSession(index, 'time', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="ayat-button-primary"
                disabled={loading}
              >
                {loading ? 'Completing Registration...' : 'Complete Registration'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
