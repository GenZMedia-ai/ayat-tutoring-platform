
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, CreditCard } from 'lucide-react';
import { useMixedStudentData } from '@/hooks/useMixedStudentData';
import { PaymentLinkModal } from './PaymentLinkModal';

export const FollowUpManagementTab: React.FC = () => {
  const { items, loading } = useMixedStudentData();
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<any>(null);

  // Filter students that are trial-completed and need follow-up
  const trialCompletedStudents = items.filter(item => 
    item.type === 'individual' && 
    item.data.status === 'trial-completed'
  );

  const handleWhatsAppContact = (student: any) => {
    const phone = student.phone.replace(/[^0-9]/g, '');
    const message = `Hello ${student.name}! Thank you for completing your trial session. I'd like to discuss our learning packages with you. When would be a good time to talk?`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading follow-up data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Follow-up Management</h3>
          <p className="text-sm text-muted-foreground">
            Students who completed trials and need follow-up for payment
          </p>
        </div>
        <Badge variant="outline">
          {trialCompletedStudents.length} requiring follow-up
        </Badge>
      </div>

      {trialCompletedStudents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No students requiring follow-up at this time.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Students who complete trials will appear here for payment processing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trialCompletedStudents.map((item) => {
            const student = item.data;
            return (
              <Card key={student.id} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{student.name}</CardTitle>
                      <CardDescription>
                        {student.uniqueId} • Age: {student.age} • {student.country}
                      </CardDescription>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      Trial Completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Phone:</span> {student.phone}
                    </div>
                    <div>
                      <span className="font-medium">Platform:</span> {student.platform}
                    </div>
                    <div>
                      <span className="font-medium">Trial Date:</span> {student.trialDate || 'Not set'}
                    </div>
                    <div>
                      <span className="font-medium">Trial Time:</span> {student.trialTime || 'Not set'}
                    </div>
                  </div>
                  
                  {student.notes && (
                    <div className="p-3 bg-muted rounded-md">
                      <span className="font-medium text-sm">Notes:</span>
                      <p className="text-sm mt-1">{student.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWhatsAppContact(student)}
                      className="flex-1"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp Follow-up
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setSelectedStudentForPayment(student)}
                      className="flex-1"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Create Payment Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedStudentForPayment && (
        <PaymentLinkModal
          student={selectedStudentForPayment}
          open={!!selectedStudentForPayment}
          onClose={() => setSelectedStudentForPayment(null)}
          onSuccess={() => {
            setSelectedStudentForPayment(null);
            // Refresh data would be called here
          }}
        />
      )}
    </div>
  );
};
