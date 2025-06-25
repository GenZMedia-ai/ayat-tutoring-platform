
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TelegramVerificationHook {
  isVerified: boolean;
  isGenerating: boolean;
  verificationCode: string | null;
  generateCode: () => Promise<void>;
  checkStatus: () => Promise<void>;
  openTelegramBot: () => void;
}

interface TelegramStatusResponse {
  verified: boolean;
  chat_id?: string;
  username?: string;
  linked_at?: string;
  error?: string;
}

export const useTelegramVerification = (): TelegramVerificationHook => {
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);

  const checkStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('check_telegram_verification_status', {
        p_user_id: user.id
      });

      if (error) throw error;

      const statusData = data as unknown as TelegramStatusResponse;
      setIsVerified(statusData.verified);
    } catch (error) {
      console.error('Error checking Telegram status:', error);
    }
  };

  const generateCode = async () => {
    if (!user || isGenerating) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.rpc('generate_telegram_verification_code', {
        p_user_id: user.id
      });

      if (error) throw error;

      setVerificationCode(data as string);
      toast.success('Verification code generated successfully');
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error('Failed to generate verification code');
    } finally {
      setIsGenerating(false);
    }
  };

  const openTelegramBot = () => {
    // Replace with your actual bot username
    const botUsername = 'tutorflow_assistant_bot'; // Update this with your actual bot username
    const telegramUrl = `https://t.me/${botUsername}`;
    window.open(telegramUrl, '_blank');
  };

  useEffect(() => {
    if (user) {
      setIsVerified(user.telegramVerified || false);
      checkStatus();
    }
  }, [user]);

  return {
    isVerified,
    isGenerating,
    verificationCode,
    generateCode,
    checkStatus,
    openTelegramBot
  };
};
