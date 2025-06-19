
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TimeSlot {
  id?: string;
  time: string; // HH:mm format in Egypt time
  isAvailable: boolean;
  isBooked: boolean;
  studentId?: string;
}

export const useTeacherAvailability = (selectedDate: Date | undefined) => {
  const { user } = useAuth();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate time slots from 8:00 AM to 10:00 PM in 30-minute intervals
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

  // Convert Egypt time to UTC for database storage
  const egyptTimeToUTC = (date: Date, time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const egyptDate = new Date(date);
    egyptDate.setHours(hours, minutes, 0, 0);
    
    // Egypt is UTC+2, so subtract 2 hours to get UTC
    const utcDate = new Date(egyptDate.getTime() - (2 * 60 * 60 * 1000));
    return utcDate.toTimeString().slice(0, 8);
  };

  // Convert UTC time from database to Egypt time for display
  const utcToEgyptTime = (utcTime: string): string => {
    const [hours, minutes] = utcTime.split(':').map(Number);
    const utcDate = new Date();
    utcDate.setHours(hours, minutes, 0, 0);
    
    // Add 2 hours to convert from UTC to Egypt time
    const egyptDate = new Date(utcDate.getTime() + (2 * 60 * 60 * 1000));
    return `${egyptDate.getHours().toString().padStart(2, '0')}:${egyptDate.getMinutes().toString().padStart(2, '0')}`;
  };

  // Fetch availability data from database
  const fetchAvailability = async () => {
    if (!selectedDate || !user) return;

    setLoading(true);
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('date', dateString);

      if (error) {
        console.error('Error fetching availability:', error);
        toast.error('Failed to fetch availability data');
        return;
      }

      // Generate all possible time slots
      const allSlots = generateTimeSlots();
      
      // Update slots with database data
      const updatedSlots = allSlots.map(slot => {
        const dbSlot = data?.find(d => utcToEgyptTime(d.time_slot) === slot.time);
        
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
      console.error('Error in fetchAvailability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  // Toggle availability for a time slot
  const toggleAvailability = async (time: string) => {
    if (!selectedDate || !user) return;

    const slot = timeSlots.find(s => s.time === time);
    if (!slot || slot.isBooked) return; // Can't modify booked slots

    const dateString = selectedDate.toISOString().split('T')[0];
    const utcTime = egyptTimeToUTC(selectedDate, time);

    try {
      if (slot.isAvailable) {
        // Remove availability
        if (slot.id) {
          const { error } = await supabase
            .from('teacher_availability')
            .delete()
            .eq('id', slot.id);

          if (error) {
            console.error('Error removing availability:', error);
            toast.error('Failed to remove availability');
            return;
          }
        }
      } else {
        // Add availability
        const { error } = await supabase
          .from('teacher_availability')
          .insert({
            teacher_id: user.id,
            date: dateString,
            time_slot: utcTime,
            is_available: true,
            is_booked: false,
          });

        if (error) {
          console.error('Error adding availability:', error);
          toast.error('Failed to add availability');
          return;
        }
      }

      // Refresh data
      await fetchAvailability();
      toast.success(slot.isAvailable ? 'Time slot removed' : 'Time slot added');
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update availability');
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [selectedDate, user]);

  return {
    timeSlots,
    loading,
    toggleAvailability,
    refreshAvailability: fetchAvailability,
  };
};
