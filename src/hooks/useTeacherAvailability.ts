
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface TimeSlot {
  id?: string;
  time: string;
  isAvailable: boolean;
  isBooked: boolean;
  studentId?: string;
}

export const useTeacherAvailability = (selectedDate: Date | undefined) => {
  const { user } = useAuth();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const formatTimeForDB = (time: string): string => {
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return time;
    }
    if (time.match(/^\d{2}:\d{2}$/)) {
      return `${time}:00`;
    }
    throw new Error(`Invalid time format: ${time}`);
  };

  const formatTimeForUI = (dbTime: string): string => {
    if (dbTime.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return dbTime.substring(0, 5);
    }
    if (dbTime.match(/^\d{2}:\d{2}$/)) {
      return dbTime;
    }
    throw new Error(`Invalid database time format: ${dbTime}`);
  };

  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 8; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time,
          isAvailable: false,
          isBooked: false,
        });
      }
    }
    return slots;
  };

  const fetchAvailability = useCallback(async () => {
    if (!selectedDate || !user) return;

    setLoading(true);
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      console.log('📊 Fetching availability for date:', dateString);
      
      const { data, error } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('date', dateString);

      if (error) {
        console.error('❌ Error fetching availability:', error);
        toast.error('Failed to fetch availability data');
        return;
      }

      const allSlots = generateTimeSlots();
      
      const updatedSlots = allSlots.map(slot => {
        const dbSlot = data?.find(d => {
          try {
            const uiTimeFromDB = formatTimeForUI(d.time_slot);
            return uiTimeFromDB === slot.time;
          } catch (error) {
            console.warn(`⚠️ Time conversion error for DB time ${d.time_slot}:`, error);
            return false;
          }
        });
        
        if (dbSlot) {
          return {
            ...slot,
            id: dbSlot.id,
            isAvailable: dbSlot.is_available || false,
            isBooked: dbSlot.is_booked || false,
            studentId: dbSlot.student_id || undefined,
          };
        }
        
        return slot;
      });

      setTimeSlots(updatedSlots);
    } catch (error) {
      console.error('❌ Error in fetchAvailability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, user]);

  const toggleAvailability = async (time: string) => {
    if (!selectedDate || !user) return;

    console.log('🎯 Toggle availability for time:', time, 'on date:', selectedDate.toDateString());

    const slot = timeSlots.find(s => s.time === time);
    if (!slot || slot.isBooked) {
      console.log('❌ Cannot modify slot:', { slot, reason: slot?.isBooked ? 'booked' : 'not found' });
      return;
    }

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      const dbTime = formatTimeForDB(time);
      
      console.log('💾 Availability toggle:', {
        selectedDate: dateString,
        uiTime: time,
        dbTime: dbTime,
        operation: slot.isAvailable ? 'remove' : 'add'
      });

      if (slot.isAvailable) {
        if (slot.id) {
          console.log('🗑️ Removing availability for slot ID:', slot.id);
          const { error } = await supabase
            .from('teacher_availability')
            .delete()
            .eq('id', slot.id);

          if (error) {
            console.error('❌ Error removing availability:', error);
            toast.error('Failed to remove availability');
            return;
          }
          console.log('✅ Successfully removed availability');
        }
      } else {
        console.log('➕ Adding availability:', {
          teacher_id: user.id,
          date: dateString,
          time_slot: dbTime,
          is_available: true,
          is_booked: false,
        });
        
        const { error } = await supabase
          .from('teacher_availability')
          .insert({
            teacher_id: user.id,
            date: dateString,
            time_slot: dbTime,
            is_available: true,
            is_booked: false,
          });

        if (error) {
          console.error('❌ Error adding availability:', error);
          toast.error('Failed to add availability');
          return;
        }
        console.log('✅ Successfully added availability');
      }

      await fetchAvailability();
      toast.success(slot.isAvailable ? 'Time slot removed' : 'Time slot added');
    } catch (error) {
      console.error('❌ Error in toggle availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refreshing availability data...');
    fetchAvailability();
  }, [fetchAvailability]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return {
    timeSlots,
    loading,
    toggleAvailability,
    refreshAvailability: fetchAvailability,
    forceRefresh,
  };
};
