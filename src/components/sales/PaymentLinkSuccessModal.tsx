
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Share, ExternalLink, Check, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentLinkSuccessModalProps {
  open: boolean;
  onClose: () => void;
  paymentData: {
    url: string;
    amount: number;
    currency: string;
    studentName: string;
    studentPhone?: string;
  };
}

export const PaymentLinkSuccessModal: React.FC<PaymentLinkSuccessModalProps> = ({
  open,
  onClose,
  paymentData
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentData.url);
      setCopied(true);
      toast.success('Payment link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Hello ${paymentData.studentName}! Your payment link is ready. Please use this secure link to complete your payment: ${paymentData.url}`;
    const phone = paymentData.studentPhone?.replace(/[^0-9]/g, '') || '';
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleOpenLink = () => {
    window.open(paymentData.url, '_blank');
  };

  const formatAmount = () => {
    const amount = paymentData.amount / 100;
    return `${paymentData.currency.toUpperCase()} ${amount.toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-green-700">
            Payment Link Created Successfully!
          </DialogTitle>
          <DialogDescription className="text-center">
            Share this secure payment link with {paymentData.studentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Details */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-800">Student:</span>
                <span className="text-sm text-green-700">{paymentData.studentName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-800">Amount:</span>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {formatAmount()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Payment Link Display */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <p className="text-xs text-gray-600 mb-1">Payment Link:</p>
            <p className="text-sm font-mono text-gray-800 break-all">
              {paymentData.url}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={handleCopyLink}
              className="w-full"
              variant={copied ? "default" : "outline"}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>

            {paymentData.studentPhone && (
              <Button
                onClick={handleShareWhatsApp}
                variant="outline"
                className="w-full"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Share via WhatsApp
              </Button>
            )}

            <Button
              onClick={handleOpenLink}
              variant="outline"
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Link
            </Button>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
