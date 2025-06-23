
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

  // PHASE 1 FIX: Proper time format conversion - Egypt time to UTC with seconds
  const egyptTimeToUTCWithSeconds = (date: Date, egyptTime: string): string => {
    console.log('🔄 PHASE 1: Egypt time to UTC conversion with seconds:', { date: date.toDateString(), egyptTime });
    
    const [hours, minutes] = egyptTime.split(':').map(Number);
    console.log('📅 Egypt time components:', { hours, minutes });
    
    // Egypt is UTC+2, so to convert FROM Egypt TO UTC, we SUBTRACT 2 hours
    const EGYPT_UTC_OFFSET = 2;
    let utcHour = hours - EGYPT_UTC_OFFSET;
    
    // Handle day boundary crossings properly
    if (utcHour < 0) {
      utcHour += 24;
      console.log('⚠️ UTC hour crossed to previous day:', utcHour);
    } else if (utcHour >= 24) {
      utcHour -= 24;
      console.log('⚠️ UTC hour crossed to next day:', utcHour);
    }
    
    const utcTime = `${String(utcHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    
    console.log('✅ PHASE 1: Egypt to UTC conversion result:', {
      egyptTime: egyptTime,
      utcTime: utcTime,
      offsetSubtracted: EGYPT_UTC_OFFSET,
      utcHour: utcHour
    });
    
    return utcTime;
  };

  // PHASE 1 FIX: UTC to Egypt time conversion - properly handle seconds
  const utcToEgyptTime = (utcTime: string, contextDate: Date): string => {
    console.log('🔄 PHASE 1: UTC to Egypt time conversion:', { utcTime, contextDate: contextDate.toDateString() });
    
    // Handle both HH:mm:ss and HH:mm formats
    const timeParts = utcTime.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    
    console.log('📅 UTC time components:', { hours, minutes });
    
    // Egypt is UTC+2, so to convert FROM UTC TO Egypt, we ADD 2 hours
    const EGYPT_UTC_OFFSET = 2;
    let egyptHour = hours + EGYPT_UTC_OFFSET;
    
    // Handle day boundary crossings properly
    if (egyptHour >= 24) {
      egyptHour -= 24;
      console.log('⚠️ Egypt hour crossed to next day:', egyptHour);
    } else if (egyptHour < 0) {
      egyptHour += 24;
      console.log('⚠️ Egypt hour crossed to previous day:', egyptHour);
    }
    
    const egyptTime = `${String(egyptHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    console.log('✅ PHASE 1: UTC to Egypt conversion result:', {
      utcTime: utcTime,
      egyptTime: egyptTime,
      offsetAdded: EGYPT_UTC_OFFSET,
      egyptHour: egyptHour
    });
    
    return egyptTime;
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

  // PHASE 1 FIX: Fetch availability data with proper time format handling
  const fetchAvailability = useCallback(async () => {
    if (!selectedDate || !user) return;

    setLoading(true);
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      console.log('📊 PHASE 1: Fetching availability for exact date:', dateString);
      
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

      // Generate all possible time slots in Egypt time
      const allSlots = generateTimeSlots();
      
      // PHASE 1 FIX: Update slots with database data using proper time conversion
      const updatedSlots = allSlots.map(slot => {
        // Find matching database slot by converting UTC time back to Egypt time
        const dbSlot = data?.find(d => {
          const convertedEgyptTime = utcToEgyptTime(d.time_slot, selectedDate);
          console.log(`🔍 PHASE 1: Comparing Egypt slot ${slot.time} with DB UTC ${d.time_slot} -> Egypt ${convertedEgyptTime}`);
          return convertedEgyptTime === slot.time;
        });
        
        if (dbSlot) {
          console.log(`✅ PHASE 1: Found matching slot for Egypt time ${slot.time}:`, { 
            dbId: dbSlot.id, 
            dbUtcTime: dbSlot.time_slot,
            isAvailable: dbSlot.is_available,
            isBooked: dbSlot.is_booked,
            studentId: dbSlot.student_id
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

      console.log('📝 PHASE 1: Final updated slots for date', dateString, ':', 
        updatedSlots.filter(s => s.isAvailable || s.isBooked).map(s => ({
          time: s.time,
          available: s.isAvailable,
          booked: s.isBooked,
          studentId: s.studentId
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

  // PHASE 1 FIX: Toggle availability with proper time format conversion
  const toggleAvailability = async (time: string) => {
    if (!selectedDate || !user) return;

    console.log('🎯 PHASE 1: Toggling availability for Egypt time:', time, 'on date:', selectedDate.toDateString());

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
    const utcTime = egyptTimeToUTCWithSeconds(selectedDate, time);

    console.log('💾 PHASE 1: Saving availability with proper conversion:', {
      selectedDate: dateString,
      egyptTime: time,
      utcTime: utcTime,
      userRole: user.role
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
            if (error.message?.includes('Teachers cannot modify availability for today')) {
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
        console.log('➕ PHASE 1: Adding availability with correct conversion:', {
          teacher_id: user.id,
          date: dateString,
          time_slot: utcTime,
          is_available: true,
          is_booked: false,
          userRole: user.role,
        });
        
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
          console.error('❌ Error adding availability:', error);
          if (error.message?.includes('Teachers cannot modify availability for today')) {
            toast.error('Cannot modify today\'s availability. Today\'s schedule is locked.');
          } else {
            toast.error('Failed to add availability');
          }
          return;
        }
        console.log('✅ PHASE 1: Successfully added availability with correct timezone conversion');
      }

      // Refresh data
      await fetchAvailability();
      toast.success(slot.isAvailable ? 'Time slot removed' : 'Time slot added');
    } catch (error) {
      console.error('❌ Error toggling availability:', error);
      if (error instanceof Error && error.message?.includes('Teachers cannot modify availability for today')) {
        toast.error('Cannot modify today\'s availability. Today\'s schedule is locked.');
      } else {
        toast.error('Failed to update availability');
      }
    }
  };

  // Force refresh availability - useful after reschedule operations
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
