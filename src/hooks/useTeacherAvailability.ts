import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EGYPT_TIMEZONE = 'Africa/Cairo';

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

  // PHASE 5: Simplified Egypt time to UTC conversion - hour only, preserve date
  const egyptTimeToUTC = (date: Date, time: string): string => {
    console.log('🔄 SIMPLIFIED Egypt time to UTC conversion:', { date: date.toDateString(), time });
    
    const [hours, minutes] = time.split(':').map(Number);
    console.log('📅 Egypt time components:', { hours, minutes });
    
    // SIMPLIFIED: Egypt is UTC+2, so subtract 2 hours
    const EGYPT_UTC_OFFSET = 2;
    let utcHour = hours - EGYPT_UTC_OFFSET;
    
    // Keep hour in 0-23 range without changing date
    if (utcHour < 0) {
      utcHour += 24;
    } else if (utcHour >= 24) {
      utcHour -= 24;
    }
    
    const utcTime = `${String(utcHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    
    console.log('✅ Simplified UTC conversion result:', {
      egyptTime: time,
      utcTime: utcTime,
      offsetApplied: EGYPT_UTC_OFFSET,
      datePreserved: true
    });
    
    return utcTime;
  };

  // PHASE 5: Simplified UTC to Egypt time conversion
  const utcToEgyptTime = (utcTime: string, contextDate: Date): string => {
    console.log('🔄 SIMPLIFIED UTC to Egypt time conversion:', utcTime);
    
    const [hours, minutes] = utcTime.split(':').map(Number);
    console.log('📅 UTC time components:', { hours, minutes });
    
    // SIMPLIFIED: Egypt is UTC+2, so add 2 hours
    const EGYPT_UTC_OFFSET = 2;
    let egyptHour = hours + EGYPT_UTC_OFFSET;
    
    // Keep hour in 0-23 range
    if (egyptHour >= 24) {
      egyptHour -= 24;
    } else if (egyptHour < 0) {
      egyptHour += 24;
    }
    
    const egyptTime = `${String(egyptHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    console.log('✅ Simplified Egypt conversion result:', {
      utcTime: utcTime,
      egyptTime: egyptTime,
      offsetApplied: EGYPT_UTC_OFFSET,
      datePreserved: true
    });
    
    return egyptTime;
  };

  // Fetch availability data from database
  const fetchAvailability = useCallback(async () => {
    if (!selectedDate || !user) return;

    setLoading(true);
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      console.log('📊 PHASE 5: Fetching availability for date (preserved):', dateString);
      
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

      console.log('📋 Fetched availability data:', data);

      // Generate all possible time slots
      const allSlots = generateTimeSlots();
      
      // Update slots with database data using simplified conversion
      const updatedSlots = allSlots.map(slot => {
        const dbSlot = data?.find(d => {
          const convertedTime = utcToEgyptTime(d.time_slot, selectedDate);
          console.log(`🔍 Comparing slot ${slot.time} with DB slot ${d.time_slot} (converted: ${convertedTime})`);
          return convertedTime === slot.time;
        });
        
        if (dbSlot) {
          console.log(`✅ Found matching slot:`, { slotTime: slot.time, dbId: dbSlot.id });
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

      console.log('📝 Final updated slots:', updatedSlots.filter(s => s.isAvailable || s.isBooked));
      setTimeSlots(updatedSlots);
    } catch (error) {
      console.error('❌ Error in fetchAvailability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, user]);

  // Toggle availability for a time slot
  const toggleAvailability = async (time: string) => {
    if (!selectedDate || !user) return;

    console.log('🎯 PHASE 5: Toggling availability for time (simplified):', time);

    const slot = timeSlots.find(s => s.time === time);
    if (!slot || slot.isBooked) {
      console.log('❌ Cannot modify slot:', { slot, reason: slot?.isBooked ? 'booked' : 'not found' });
      return; // Can't modify booked slots
    }

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const utcTime = egyptTimeToUTC(selectedDate, time);

    console.log('💾 PHASE 5: Saving availability with preserved date:', {
      originalDate: dateString,
      egyptTime: time,
      utcTime: utcTime,
      datePreservationCheck: 'Same date used for storage'
    });

    try {
      if (slot.isAvailable) {
        // Remove availability
        if (slot.id) {
          console.log('🗑️ Removing availability for slot ID:', slot.id);
          const { error } = await supabase
            .from('teacher_availability')
            .delete()
            .eq('id', slot.id);

          if (error) {
            console.error('❌ Error removing availability:', error);
            if (error.message?.includes('Cannot modify availability for today')) {
              toast.error('Cannot modify today\'s availability. Today\'s schedule is locked.');
            } else {
              toast.error('Failed to remove availability');
            }
            return;
          }
          console.log('✅ Successfully removed availability');
        }
      } else {
        // Add availability
        console.log('➕ Adding availability (date preserved):', {
          teacher_id: user.id,
          date: dateString, // Preserved date
          time_slot: utcTime,
          is_available: true,
          is_booked: false,
        });
        
        const { error } = await supabase
          .from('teacher_availability')
          .insert({
            teacher_id: user.id,
            date: dateString, // Use preserved date
            time_slot: utcTime,
            is_available: true,
            is_booked: false,
          });

        if (error) {
          console.error('❌ Error adding availability:', error);
          if (error.message?.includes('Cannot modify availability for today')) {
            toast.error('Cannot modify today\'s availability. Today\'s schedule is locked.');
          } else {
            toast.error('Failed to add availability');
          }
          return;
        }
        console.log('✅ Successfully added availability with preserved date');
      }

      // Refresh data
      await fetchAvailability();
      toast.success(slot.isAvailable ? 'Time slot removed' : 'Time slot added');
    } catch (error) {
      console.error('❌ Error toggling availability:', error);
      toast.error('Failed to update availability');
    }
  };

  // Force refresh availability - useful after reschedule operations
  const forceRefresh = useCallback(() => {
    console.log('🔄 PHASE 5: Force refreshing availability data...');
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
