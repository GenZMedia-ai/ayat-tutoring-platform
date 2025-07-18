
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRescheduleNotifications = (onReschedule?: () => void) => {
  useEffect(() => {
    console.log('🔄 Setting up reschedule notifications');

    // Listen for updates to teacher_availability table
    const availabilityChannel = supabase
      .channel('reschedule-availability-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teacher_availability'
        },
        (payload) => {
          console.log('📅 Availability updated:', payload);
          if (onReschedule) {
            onReschedule();
          }
        }
      )
      .subscribe();

    // Listen for updates to students table (reschedule changes)
    const studentsChannel = supabase
      .channel('reschedule-student-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'students',
          filter: 'trial_date=neq.null'
        },
        (payload) => {
          console.log('👤 Student rescheduled:', payload);
          if (payload.new && payload.old) {
            const oldDate = payload.old.trial_date;
            const newDate = payload.new.trial_date;
            const oldTime = payload.old.trial_time;
            const newTime = payload.new.trial_time;
            
            if (oldDate !== newDate || oldTime !== newTime) {
              toast.success('A student trial session has been rescheduled');
              if (onReschedule) {
                onReschedule();
              }
            }
          }
        }
      )
      .subscribe();

    // Listen for session updates (reschedule tracking)
    const sessionsChannel = supabase
      .channel('reschedule-session-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: 'reschedule_count=gt.0'
        },
        (payload) => {
          console.log('📝 Session reschedule tracked:', payload);
          if (onReschedule) {
            onReschedule();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up reschedule notification channels');
      supabase.removeChannel(availabilityChannel);
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(sessionsChannel);
    };
  }, [onReschedule]);
};
