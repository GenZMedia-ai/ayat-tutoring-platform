
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Share, ExternalLink, Check, MessageCircle, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { UrlShorteningService } from '@/services/urlShorteningService';

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
  const [shortUrl, setShortUrl] = useState<string>('');
  const [loadingShortUrl, setLoadingShortUrl] = useState(false);
  const [showFullUrl, setShowFullUrl] = useState(false);

  // PHASE 3: Create short URL when modal opens
  useEffect(() => {
    if (open && paymentData.url && !shortUrl) {
      createShortUrl();
    }
  }, [open, paymentData.url]);

  const createShortUrl = async () => {
    setLoadingShortUrl(true);
    try {
      const result = await UrlShorteningService.createShortUrl({
        originalUrl: paymentData.url,
        studentName: paymentData.studentName,
        expiresInDays: 30
      });

      if (result.success && result.shortUrl) {
        setShortUrl(result.shortUrl);
      } else {
        console.error('Failed to create short URL:', result.error);
        // Fallback to original URL
        setShowFullUrl(true);
      }
    } catch (error) {
      console.error('Error creating short URL:', error);
      setShowFullUrl(true);
    } finally {
      setLoadingShortUrl(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const linkToCopy = shortUrl || paymentData.url;
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      toast.success('Payment link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShareWhatsApp = () => {
    const linkToShare = shortUrl || paymentData.url;
    const message = `Hello ${paymentData.studentName}! Your payment link is ready. Please use this secure link to complete your payment: ${linkToShare}`;
    const phone = paymentData.studentPhone?.replace(/[^0-9]/g, '') || '';
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleOpenLink = () => {
    const linkToOpen = shortUrl || paymentData.url;
    window.open(linkToOpen, '_blank');
  };

  const formatAmount = () => {
    const amount = paymentData.amount / 100;
    return `${paymentData.currency.toUpperCase()} ${amount.toFixed(2)}`;
  };

  const displayUrl = showFullUrl ? paymentData.url : (shortUrl || paymentData.url);

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

          {/* PHASE 3: Enhanced Payment Link Display with Shortening */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-600">Payment Link:</p>
              {!loadingShortUrl && shortUrl && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullUrl(!showFullUrl)}
                    className="text-xs h-6 px-2"
                  >
                    <Link2 className="h-3 w-3 mr-1" />
                    {showFullUrl ? 'Short' : 'Full'}
                  </Button>
                </div>
              )}
            </div>
            
            {loadingShortUrl ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                Creating short link...
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-mono text-gray-800 break-all">
                  {displayUrl}
                </p>
                {shortUrl && !showFullUrl && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Check className="h-3 w-3" />
                    Shortened with ayatbian.link
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={handleCopyLink}
              className="w-full"
              variant={copied ? "default" : "outline"}
              disabled={loadingShortUrl}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  {loadingShortUrl ? 'Preparing...' : 'Copy Link'}
                </>
              )}
            </Button>

            {paymentData.studentPhone && (
              <Button
                onClick={handleShareWhatsApp}
                variant="outline"
                className="w-full"
                disabled={loadingShortUrl}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Share via WhatsApp
              </Button>
            )}

            <Button
              onClick={handleOpenLink}
              variant="outline"
              className="w-full"
              disabled={loadingShortUrl}
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
