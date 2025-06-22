
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWhatsAppContact = () => {
  const [loading, setLoading] = useState(false);

  const logContact = async (
    studentId: string, 
    contactType: 'trial_confirmation' | 'follow_up' | 'reminder' = 'trial_confirmation',
    success: boolean = true,
    notes?: string
  ) => {
    setLoading(true);
    try {
      console.log('📞 Logging WhatsApp contact:', { studentId, contactType, success });
      
      const { data, error } = await supabase.rpc('log_whatsapp_contact', {
        p_student_id: studentId,
        p_contact_type: contactType,
        p_success: success,
        p_notes: notes
      });

      if (error) {
        console.error('❌ Error logging contact:', error);
        toast.error('Failed to log contact attempt');
        return false;
      }

      console.log('✅ Contact logged successfully:', data);
      
      // Updated message - no longer mentions status changes
      toast.success('Contact attempt logged successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Error in logContact:', error);
      toast.error('Failed to log contact');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (phone: string, message?: string) => {
    const defaultMessage = "Hello! I'm your assigned teacher from Ayat w Bian. I'd like to confirm your trial session details and introduce myself.";
    const encodedMessage = encodeURIComponent(message || defaultMessage);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    console.log('📱 Opening WhatsApp:', whatsappUrl);
    window.open(whatsappUrl, '_blank');
  };

  return {
    loading,
    logContact,
    openWhatsApp
  };
};
