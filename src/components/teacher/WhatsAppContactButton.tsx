
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MessageCircle, Phone, ExternalLink } from 'lucide-react';
import { useWhatsAppContacts } from '@/hooks/useWhatsAppContacts';
import { Student } from '@/types';

interface WhatsAppContactButtonProps {
  student: Student;
  contactType?: 'trial_confirmation' | 'follow_up' | 'reminder';
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  onContactLogged?: () => void;
}

const WhatsAppContactButton: React.FC<WhatsAppContactButtonProps> = ({
  student,
  contactType = 'trial_confirmation',
  size = 'default',
  variant = 'default',
  onContactLogged
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [success, setSuccess] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  
  const { logWhatsAppContact, isLogging } = useWhatsAppContacts();

  const generateWhatsAppMessage = () => {
    const trialTime = student.trialTime ? 
      new Date(`2000-01-01T${student.trialTime}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) : 'TBD';

    const trialDate = student.trialDate ? 
      new Date(student.trialDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'TBD';

    switch (contactType) {
      case 'trial_confirmation':
        return `Hello ${student.name}! 👋

This is your English teacher confirming your trial lesson scheduled for:
📅 ${trialDate}
⏰ ${trialTime}

I'm excited to meet you and help you with your English learning journey! Please confirm if this time works for you.

Best regards,
Your English Teacher 📚✨`;

      case 'follow_up':
        return `Hi ${student.name}! 👋

I hope you're doing well. I wanted to follow up regarding your English learning journey. 

Would you like to discuss continuing with regular lessons? I'm here to answer any questions you might have.

Best regards,
Your English Teacher 📚`;

      case 'reminder':
        return `Hi ${student.name}! 👋

Just a friendly reminder about your trial lesson:
📅 ${trialDate}
⏰ ${trialTime}

Looking forward to our session! Please let me know if you need any technical help with the platform.

Best regards,
Your English Teacher 📚✨`;

      default:
        return `Hello ${student.name}! 👋

I hope this message finds you well. Please let me know if you have any questions about your English lessons.

Best regards,
Your English Teacher 📚`;
    }
  };

  const openWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${student.phone.replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleContactLogged = async () => {
    try {
      await logWhatsAppContact(student.id, contactType, success, notes || undefined);
      setIsOpen(false);
      setNotes('');
      onContactLogged?.();
    } catch (error) {
      console.error('Failed to log contact:', error);
    }
  };

  const getContactTypeLabel = () => {
    switch (contactType) {
      case 'trial_confirmation':
        return 'Trial Confirmation';
      case 'follow_up':
        return 'Follow-up';
      case 'reminder':
        return 'Reminder';
      default:
        return 'Contact';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact {student.name}
          </DialogTitle>
          <DialogDescription>
            {getContactTypeLabel()} via WhatsApp
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-2">Message Preview:</p>
            <p className="text-sm whitespace-pre-wrap">{generateWhatsAppMessage()}</p>
          </div>
          
          <Button
            onClick={openWhatsApp}
            className="w-full gap-2"
            variant="outline"
          >
            <ExternalLink className="w-4 h-4" />
            Open WhatsApp
          </Button>
          
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-medium">Contact Result</Label>
            <RadioGroup
              value={success ? 'success' : 'failed'}
              onValueChange={(value) => setSuccess(value === 'success')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="success" id="success" />
                <Label htmlFor="success">Successfully contacted student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="failed" id="failed" />
                <Label htmlFor="failed">Unable to reach student</Label>
              </div>
            </RadioGroup>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about the contact attempt..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            
            <Button
              onClick={handleContactLogged}
              disabled={isLogging}
              className="w-full"
            >
              {isLogging ? 'Logging...' : 'Log Contact Result'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppContactButton;
