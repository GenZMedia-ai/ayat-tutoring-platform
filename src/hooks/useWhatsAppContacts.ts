
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useWhatsAppContacts = () => {
  const [isLogging, setIsLogging] = useState(false);
  const { toast } = useToast();

  const logWhatsAppContact = async (
    studentId: string,
    contactType: 'trial_confirmation' | 'follow_up' | 'reminder' = 'trial_confirmation',
    success: boolean = true,
    notes?: string
  ) => {
    setIsLogging(true);
    
    try {
      console.log('Logging WhatsApp contact:', {
        studentId,
        contactType,
        success,
        notes
      });

      const { data, error } = await supabase.rpc('log_whatsapp_contact', {
        p_student_id: studentId,
        p_contact_type: contactType,
        p_success: success,
        p_notes: notes
      });

      if (error) {
        console.error('Error logging WhatsApp contact:', error);
        throw error;
      }

      console.log('WhatsApp contact logged successfully:', data);

      toast({
        title: success ? "Contact Logged" : "Contact Attempt Logged",
        description: success 
          ? `Student contacted successfully via WhatsApp (Attempt #${data.attempt_number})`
          : `Contact attempt #${data.attempt_number} logged`,
      });

      return data;
    } catch (error: any) {
      console.error('Failed to log WhatsApp contact:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to log contact attempt",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLogging(false);
    }
  };

  const getContactHistory = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching contact history:', error);
      return [];
    }
  };

  return {
    logWhatsAppContact,
    getContactHistory,
    isLogging
  };
};
