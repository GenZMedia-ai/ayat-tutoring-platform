
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MessageCircle, Phone, ExternalLink } from 'lucide-react';
import { useWhatsAppContacts } from '@/hooks/useWhatsAppContacts';

interface WhatsAppContactButtonProps {
  studentId: string;
  phone: string;
  studentName: string;
  contactType?: 'trial_confirmation' | 'follow_up' | 'reminder' | 'package_purchased' | 'session_reminder';
  customMessage?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  children?: React.ReactNode;
  onContactLogged?: () => void;
}

const WhatsAppContactButton: React.FC<WhatsAppContactButtonProps> = ({
  studentId,
  phone,
  studentName,
  contactType = 'trial_confirmation',
  customMessage,
  size = 'default',
  variant = 'default',
  className = '',
  children,
  onContactLogged
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [success, setSuccess] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  
  const { logWhatsAppContact, isLogging } = useWhatsAppContacts();

  const generateWhatsAppMessage = () => {
    if (customMessage) {
      return customMessage;
    }

    switch (contactType) {
      case 'trial_confirmation':
        return `Hello ${studentName}! 👋

This is your English teacher confirming your trial lesson.

I'm excited to meet you and help you with your English learning journey! Please confirm if this time works for you.

Best regards,
Your English Teacher 📚✨`;

      case 'follow_up':
        return `Hi ${studentName}! 👋

I hope you're doing well. I wanted to follow up regarding your English learning journey. 

Would you like to discuss continuing with regular lessons? I'm here to answer any questions you might have.

Best regards,
Your English Teacher 📚`;

      case 'reminder':
        return `Hi ${studentName}! 👋

Just a friendly reminder about your upcoming lesson.

Looking forward to our session! Please let me know if you need any technical help with the platform.

Best regards,
Your English Teacher 📚✨`;

      case 'package_purchased':
        return `Congratulations ${studentName}! 🎉

Your package has been confirmed. Let's schedule your sessions. When would be a good time to discuss the schedule?

Best regards,
Your English Teacher 📚`;

      case 'session_reminder':
        return `Hi ${studentName}! 👋

Reminder about your session today. Looking forward to our lesson!

Best regards,
Your English Teacher 📚✨`;

      default:
        return `Hello ${studentName}! 👋

I hope this message finds you well. Please let me know if you have any questions about your English lessons.

Best regards,
Your English Teacher 📚`;
    }
  };

  const openWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleContactLogged = async () => {
    try {
      // Map extended contact types to basic ones for logging
      const logContactType = ['package_purchased', 'session_reminder'].includes(contactType) 
        ? 'follow_up' 
        : contactType as 'trial_confirmation' | 'follow_up' | 'reminder';
        
      await logWhatsAppContact(studentId, logContactType, success, notes || undefined);
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
      case 'package_purchased':
        return 'Package Purchase';
      case 'session_reminder':
        return 'Session Reminder';
      default:
        return 'Contact';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {children || (
            <>
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact {studentName}
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
