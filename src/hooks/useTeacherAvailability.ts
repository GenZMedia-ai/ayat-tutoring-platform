
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

  // PHASE 3 FIX: Standardize time format conversion functions
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

  // Check if current date is today in Egypt timezone
  const isToday = (date: Date): boolean => {
    const today = new Date();
    const egyptToday = new Date(today.toLocaleString("en-US", {timeZone: "Africa/Cairo"}));
    return date.toDateString() === egyptToday.toDateString();
  };

  // Enhanced validation for teacher operations on today's availability
  const validateTeacherTodayOperation = (date: Date): boolean => {
    // Only apply restrictions to teachers, not admins
    if (user?.role !== 'teacher') {
      console.log('✅ Non-teacher user - no restrictions applied');
      return true;
    }

    if (isToday(date)) {
      console.log('❌ Teacher attempting to modify today\'s availability - blocked');
      toast.error('Cannot modify today\'s availability. Today\'s schedule is locked to prevent disruption of confirmed bookings.');
      return false;
    }

    console.log('✅ Teacher operation allowed - not today\'s date');
    return true;
  };

  // PHASE 3 FIX: Enhanced availability fetching with proper time format handling
  const fetchAvailability = useCallback(async () => {
    if (!selectedDate || !user) return;

    setLoading(true);
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      console.log('📊 PHASE 3: Fetching availability with enhanced time handling for date:', dateString);
      
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

      console.log('📋 PHASE 3: Raw database data for date', dateString, ':', data);

      // Generate all possible time slots in Egypt time (UI format)
      const allSlots = generateTimeSlots();
      
      // PHASE 3 FIX: Update slots with database data using enhanced time conversion
      const updatedSlots = allSlots.map(slot => {
        // Find matching database slot by converting UI time to DB format for comparison
        const dbSlot = data?.find(d => {
          try {
            const uiTimeFromDB = formatTimeForUI(d.time_slot);
            const match = uiTimeFromDB === slot.time;
            if (match) {
              console.log(`✅ PHASE 3: Time match found - UI: ${slot.time}, DB: ${d.time_slot}, Converted: ${uiTimeFromDB}`);
            }
            return match;
          } catch (error) {
            console.warn(`⚠️ PHASE 3: Time conversion error for DB time ${d.time_slot}:`, error);
            return false;
          }
        });
        
        if (dbSlot) {
          console.log(`✅ PHASE 3: Found matching slot for UI time ${slot.time}:`, { 
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

      console.log('📝 PHASE 3: Final updated slots for date', dateString, ':', 
        updatedSlots.filter(s => s.isAvailable || s.isBooked).map(s => ({
          time: s.time,
          available: s.isAvailable,
          booked: s.isBooked
        }))
      );
      setTimeSlots(updatedSlots);
    } catch (error) {
      console.error('❌ PHASE 3: Error in fetchAvailability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, user]);

  // PHASE 3 FIX: Enhanced toggle availability with proper time format conversion
  const toggleAvailability = async (time: string) => {
    if (!selectedDate || !user) return;

    console.log('🎯 PHASE 3: Enhanced toggle availability for UI time:', time, 'on date:', selectedDate.toDateString());

    // Enhanced teacher validation for today's availability
    if (!validateTeacherTodayOperation(selectedDate)) {
      return; // Validation failed, operation blocked
    }

    const slot = timeSlots.find(s => s.time === time);
    if (!slot || slot.isBooked) {
      console.log('❌ Cannot modify slot:', { slot, reason: slot?.isBooked ? 'booked' : 'not found' });
      return; // Can't modify booked slots
    }

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      // PHASE 3 FIX: Convert UI time to database format
      const dbTime = formatTimeForDB(time);
      
      console.log('💾 PHASE 3: Enhanced availability toggle with proper time conversion:', {
        selectedDate: dateString,
        uiTime: time,
        dbTime: dbTime,
        userRole: user.role,
        operation: slot.isAvailable ? 'remove' : 'add'
      });

      if (slot.isAvailable) {
        // Remove availability
        if (slot.id) {
          console.log('🗑️ PHASE 3: Removing availability for slot ID:', slot.id);
          const { error } = await supabase
            .from('teacher_availability')
            .delete()
            .eq('id', slot.id);

          if (error) {
            console.error('❌ PHASE 3: Error removing availability:', error);
            if (error.message?.includes('Teachers cannot modify availability for today')) {
              toast.error('Cannot modify today\'s availability. Today\'s schedule is locked.');
            } else {
              toast.error('Failed to remove availability');
            }
            return;
          }
          console.log('✅ PHASE 3: Successfully removed availability');
        }
      } else {
        // Add availability
        console.log('➕ PHASE 3: Adding availability with enhanced time conversion:', {
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
          console.error('❌ PHASE 3: Error adding availability:', error);
          if (error.message?.includes('Teachers cannot modify availability for today')) {
            toast.error('Cannot modify today\'s availability. Today\'s schedule is locked.');
          } else {
            toast.error('Failed to add availability');
          }
          return;
        }
        console.log('✅ PHASE 3: Successfully added availability with enhanced time conversion');
      }

      // Refresh data
      await fetchAvailability();
      toast.success(slot.isAvailable ? 'Time slot removed' : 'Time slot added');
    } catch (error) {
      console.error('❌ PHASE 3: Error in enhanced toggle availability:', error);
      if (error instanceof Error && error.message?.includes('Teachers cannot modify availability for today')) {
        toast.error('Cannot modify today\'s availability. Today\'s schedule is locked.');
      } else {
        toast.error('Failed to update availability');
      }
    }
  };

  // Force refresh availability - useful after reschedule operations
  const forceRefresh = useCallback(() => {
    console.log('🔄 PHASE 3: Force refreshing availability data with enhanced handling...');
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
