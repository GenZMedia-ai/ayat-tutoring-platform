import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { convertEgyptTimeToUTC } from '@/utils/egyptTimezone';

export interface TimeSlot {
  id?: string;
  time: string; // 12-hour format for UI display (e.g., "1:00 PM")
  time24: string; // 24-hour format for calculations (e.g., "13:00")
  isAvailable: boolean;
  isBooked: boolean;
  studentId?: string;
}

export const useTeacherAvailability = (selectedDate: Date | undefined) => {
  const { user } = useAuth();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate Egypt timezone slots using the centralized utility
  const generateEgyptTimeSlots = (): Array<{ time24: string; time12: string }> => {
    const slots = [];
    
    // Generate slots from 8:00 AM to 10:00 PM (22:00) in 30-minute intervals
    for (let hour = 8; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHours = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const time12 = `${displayHours}:${minute.toString().padStart(2, '0')} ${period}`;
        
        slots.push({ time24, time12 });
      }
    }
    
    return slots;
  };

  // Generate time slots with 12-hour format for display
  const generateTimeSlots = (): TimeSlot[] => {
    const egyptSlots = generateEgyptTimeSlots();
    
    return egyptSlots.map(slot => ({
      time: slot.time12, // 12-hour format for display
      time24: slot.time24, // 24-hour format for calculations
      isAvailable: false,
      isBooked: false,
    }));
  };

  // Enhanced availability fetching with proper timezone handling
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

      console.log('📋 Database availability data:', data);

      // Generate all possible time slots
      const allSlots = generateTimeSlots();
      
      // Update slots with database data
      const updatedSlots = allSlots.map(slot => {
        // Find matching database slot by converting Egypt time to UTC for comparison
        const utcTime = convertEgyptTimeToUTC(slot.time24, selectedDate);
        const dbSlot = data?.find(d => d.time_slot === utcTime);
        
        if (dbSlot) {
          console.log(`✅ Found matching slot - Egypt: ${slot.time24}, UTC: ${utcTime}:`, {
            dbId: dbSlot.id,
            isAvailable: dbSlot.is_available,
            isBooked: dbSlot.is_booked
          });
          
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

      console.log('📝 Final updated slots:', 
        updatedSlots.filter(s => s.isAvailable || s.isBooked).map(s => ({
          display: s.time,
          egypt24: s.time24,
          available: s.isAvailable,
          booked: s.isBooked
        }))
      );
      
      setTimeSlots(updatedSlots);
    } catch (error) {
      console.error('❌ Error in fetchAvailability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, user]);

  // Enhanced toggle availability with proper timezone conversion
  const toggleAvailability = async (displayTime: string) => {
    if (!selectedDate || !user) return;

    console.log('🎯 Toggle availability for display time:', displayTime);

    const slot = timeSlots.find(s => s.time === displayTime);
    if (!slot || slot.isBooked) {
      console.log('❌ Cannot modify slot:', { slot, reason: slot?.isBooked ? 'booked' : 'not found' });
      if (slot?.isBooked) {
        toast.error('Cannot modify booked time slots');
      }
      return;
    }

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      // Convert Egypt time to UTC for database storage - CRITICAL for proper storage
      const utcTime = convertEgyptTimeToUTC(slot.time24, selectedDate);
      
      console.log('💾 Availability toggle with timezone conversion:', {
        selectedDate: dateString,
        displayTime: displayTime,
        egypt24Time: slot.time24,
        utcTime: utcTime,
        operation: slot.isAvailable ? 'remove' : 'add'
      });

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
            toast.error('Failed to remove availability');
            return;
          }
          console.log('✅ Successfully removed availability');
        }
      } else {
        // Add availability with proper UTC conversion
        console.log('➕ Adding availability with timezone conversion:', {
          teacher_id: user.id,
          date: dateString,
          time_slot: utcTime, // Store UTC time in database
          is_available: true,
          is_booked: false,
        });
        
        const { error } = await supabase
          .from('teacher_availability')
          .insert({
            teacher_id: user.id,
            date: dateString,
            time_slot: utcTime, // Properly converted UTC time
            is_available: true,
            is_booked: false,
          });

        if (error) {
          console.error('❌ Error adding availability:', error);
          toast.error('Failed to add availability');
          return;
        }
        console.log('✅ Successfully added availability with timezone conversion');
      }

      // Refresh data
      await fetchAvailability();
      toast.success(slot.isAvailable ? 'Time slot removed' : 'Time slot added');
    } catch (error) {
      console.error('❌ Error in toggle availability:', error);
      toast.error('Failed to update availability');
    }
  };

  // Force refresh availability
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
