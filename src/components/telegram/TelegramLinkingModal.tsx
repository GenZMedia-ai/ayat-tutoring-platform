
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, MessageCircle, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { useTelegramVerification } from '@/hooks/useTelegramVerification';
import { toast } from 'sonner';

interface TelegramLinkingModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const TelegramLinkingModal: React.FC<TelegramLinkingModalProps> = ({ isOpen, onClose }) => {
  const { isVerified, isGenerating, verificationCode, generateCode, checkStatus, openTelegramBot } = useTelegramVerification();
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Auto-refresh status every 5 seconds
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      checkStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, checkStatus]);

  // Countdown timer for code expiration
  useEffect(() => {
    if (!verificationCode) return;

    setTimeLeft(300); // 5 minutes in seconds
    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [verificationCode]);

  const copyCode = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(verificationCode);
      toast.success('Code copied to clipboard');
    }
  };

  const handleGenerateCode = async () => {
    await generateCode();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isVerified) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Telegram Linked Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Your Telegram account has been successfully linked. You can now access your dashboard.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Link Your Telegram Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Required Setup</CardTitle>
              <CardDescription>
                For security and communication purposes, you must link your Telegram account to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!verificationCode ? (
                <div className="text-center">
                  <Button 
                    onClick={handleGenerateCode} 
                    disabled={isGenerating}
                    className="ayat-button-primary"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Verification Code'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-600">
                        Expires in: {formatTime(timeLeft)}
                      </span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-primary mb-2">
                      {verificationCode}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={copyCode}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Code
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">1</Badge>
                      <span>Copy the verification code above</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">2</Badge>
                      <span>Open our Telegram bot</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">3</Badge>
                      <span>Send the code to the bot</span>
                    </div>
                  </div>

                  <Button 
                    onClick={openTelegramBot}
                    className="w-full ayat-button-primary"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Open Telegram Bot
                  </Button>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={checkStatus}
                      className="flex-1"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Check Status
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleGenerateCode}
                      disabled={isGenerating}
                      className="flex-1"
                    >
                      Generate New Code
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Why is this required?</p>
                <p>Telegram integration ensures secure communication and important notifications reach you directly.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramLinkingModal;
