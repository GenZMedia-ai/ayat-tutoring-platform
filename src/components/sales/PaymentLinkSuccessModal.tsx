
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, ExternalLink, MessageCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { UrlShorteningService } from '@/services/urlShorteningService';

interface PaymentLinkSuccessModalProps {
  open: boolean;
  onClose: () => void;
  paymentLink: string;
  studentName: string;
  studentPhone: string;
  amount: number;
  currency: string;
}

export const PaymentLinkSuccessModal: React.FC<PaymentLinkSuccessModalProps> = ({
  open,
  onClose,
  paymentLink,
  studentName,
  studentPhone,
  amount,
  currency
}) => {
  const [copied, setCopied] = useState(false);
  const [shortUrl, setShortUrl] = useState<string>('');
  const [shorteningUrl, setShorteningUrl] = useState(false);

  // Generate short URL on modal open
  React.useEffect(() => {
    if (open && paymentLink && !shortUrl) {
      setShorteningUrl(true);
      // Use the fallback method for immediate display
      const readableShortUrl = UrlShorteningService.createReadableShortUrl(paymentLink, studentName);
      setShortUrl(readableShortUrl);
      setShorteningUrl(false);
    }
  }, [open, paymentLink, studentName, shortUrl]);

  const handleCopyLink = async () => {
    try {
      const linkToCopy = shortUrl || paymentLink;
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      toast.success('Payment link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleOpenLink = () => {
    window.open(paymentLink, '_blank');
  };

  const handleWhatsAppShare = () => {
    const phone = studentPhone.replace(/[^0-9]/g, '');
    const linkToShare = shortUrl || paymentLink;
    const message = `Hello ${studentName}! 🎉

Thank you for completing your trial session! We're excited to continue your Quran learning journey.

Here's your secure payment link to get started with your chosen package:
${linkToShare}

💰 Amount: ${currency.toUpperCase()} ${amount}
🔒 Secure Stripe payment
⏰ Link expires in 24 hours

If you have any questions, please don't hesitate to ask!

Best regards,
Your Ayat Academy Team`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const displayLink = shortUrl || paymentLink;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-600">Payment Link Created! 🎉</DialogTitle>
          <DialogDescription>
            The payment link has been successfully generated for {studentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-center space-y-2">
              <p className="font-medium text-green-800">Payment Details</p>
              <p className="text-2xl font-bold text-green-600">
                {currency.toUpperCase()} {amount}
              </p>
              <p className="text-sm text-green-700">for {studentName}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-link">
              {shorteningUrl ? 'Shortened Payment Link (Loading...)' : 'Shortened Payment Link'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="payment-link"
                value={shorteningUrl ? 'Generating short URL...' : displayLink}
                readOnly
                className="font-mono text-sm"
                disabled={shorteningUrl}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                disabled={shorteningUrl}
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {shortUrl && (
              <p className="text-xs text-muted-foreground">
                ✨ Shortened from original Stripe URL for easy sharing
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleOpenLink}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Link
            </Button>
            <Button
              onClick={handleWhatsAppShare}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Share via WhatsApp
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Link expires in 24 hours</p>
            <p>• Secure Stripe payment processing</p>
            <p>• Student will receive email confirmation after payment</p>
          </div>

          <Button
            onClick={onClose}
            className="w-full"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
