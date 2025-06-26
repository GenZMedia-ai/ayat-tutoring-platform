
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EGYPT_TIMEZONE = 'Africa/Cairo';

export interface TimeSlot {
  id?: string;
  time: string; // HH:mm format in Egypt time for UI display
  isAvailable: boolean;
  isBooked: boolean;
  studentId?: string;
}

export const useTeacherAvailability = (selectedDate: Date | undefined) => {
  const { user } = useAuth();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Standardize time format conversion functions
  const formatTimeForDB = (time: string): string => {
    // Convert UI time (HH:MM) to database format (HH:MM:SS)
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return time; // Already in correct format
    }
    if (time.match(/^\d{2}:\d{2}$/)) {
      return `${time}:00`; // Add seconds
    }
    throw new Error(`Invalid time format: ${time}`);
  };

  const formatTimeForUI = (dbTime: string): string => {
    // Convert database time (HH:MM:SS) to UI format (HH:MM)
    if (dbTime.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return dbTime.substring(0, 5); // Remove seconds
    }
    if (dbTime.match(/^\d{2}:\d{2}$/)) {
      return dbTime; // Already in UI format
    }
    throw new Error(`Invalid database time format: ${dbTime}`);
  };

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

  // Enhanced availability fetching with proper time format handling
  const fetchAvailability = useCallback(async () => {
    if (!selectedDate || !user) return;

    setLoading(true);
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      console.log('📊 Fetching availability with enhanced time handling for date:', dateString);
      
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

      console.log('📋 Raw database data for date', dateString, ':', data);

      // Generate all possible time slots in Egypt time (UI format)
      const allSlots = generateTimeSlots();
      
      // Update slots with database data using enhanced time conversion
      const updatedSlots = allSlots.map(slot => {
        // Find matching database slot by converting UI time to DB format for comparison
        const dbSlot = data?.find(d => {
          try {
            const uiTimeFromDB = formatTimeForUI(d.time_slot);
            const match = uiTimeFromDB === slot.time;
            if (match) {
              console.log(`✅ Time match found - UI: ${slot.time}, DB: ${d.time_slot}, Converted: ${uiTimeFromDB}`);
            }
            return match;
          } catch (error) {
            console.warn(`⚠️ Time conversion error for DB time ${d.time_slot}:`, error);
            return false;
          }
        });
        
        if (dbSlot) {
          console.log(`✅ Found matching slot for UI time ${slot.time}:`, { 
            dbId: dbSlot.id, 
            dbTime: dbSlot.time_slot,
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

      console.log('📝 Final updated slots for date', dateString, ':', 
        updatedSlots.filter(s => s.isAvailable || s.isBooked).map(s => ({
          time: s.time,
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

  // Enhanced toggle availability - TODAY'S LOCK REMOVED
  const toggleAvailability = async (time: string) => {
    if (!selectedDate || !user) return;

    console.log('🎯 Enhanced toggle availability for UI time:', time, 'on date:', selectedDate.toDateString());

    const slot = timeSlots.find(s => s.time === time);
    if (!slot || slot.isBooked) {
      console.log('❌ Cannot modify slot:', { slot, reason: slot?.isBooked ? 'booked' : 'not found' });
      if (slot?.isBooked) {
        toast.error('Cannot modify booked time slots');
      }
      return; // Can't modify booked slots
    }

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      // Convert UI time to database format
      const dbTime = formatTimeForDB(time);
      
      console.log('💾 Enhanced availability toggle with proper time conversion:', {
        selectedDate: dateString,
        uiTime: time,
        dbTime: dbTime,
        userRole: user.role,
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
        // Add availability
        console.log('➕ Adding availability with enhanced time conversion:', {
          teacher_id: user.id,
          date: dateString,
          time_slot: dbTime,
          is_available: true,
          is_booked: false,
          userRole: user.role,
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
        console.log('✅ Successfully added availability with enhanced time conversion');
      }

      // Refresh data
      await fetchAvailability();
      toast.success(slot.isAvailable ? 'Time slot removed' : 'Time slot added');
    } catch (error) {
      console.error('❌ Error in enhanced toggle availability:', error);
      toast.error('Failed to update availability');
    }
  };

  // Force refresh availability - useful after reschedule operations
  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refreshing availability data with enhanced handling...');
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
