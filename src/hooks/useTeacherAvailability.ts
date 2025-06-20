
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, parse } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

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

  // Convert Egypt time to UTC for database storage using proper timezone handling
  const egyptTimeToUTC = (date: Date, time: string): string => {
    console.log('🔄 Converting Egypt time to UTC:', { date: date.toDateString(), time });
    
    // Create a date string in YYYY-MM-DD format
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Create a full datetime string
    const dateTimeString = `${dateString} ${time}`;
    console.log('📅 Egypt DateTime String:', dateTimeString);
    
    // Parse this string as if it's in Egypt timezone (browser-timezone agnostic)
    const egyptDateTime = parse(dateTimeString, 'yyyy-MM-dd HH:mm', new Date());
    console.log('🕰️ Parsed Egypt DateTime:', egyptDateTime);
    
    // Convert from Egypt timezone to UTC
    const utcDateTime = fromZonedTime(egyptDateTime, EGYPT_TIMEZONE);
    console.log('🌐 UTC DateTime:', utcDateTime);
    
    // Format as HH:mm:ss for database storage
    const utcTime = format(utcDateTime, 'HH:mm:ss');
    console.log('✅ Final UTC time for storage:', utcTime);
    
    return utcTime;
  };

  // Convert UTC time from database to Egypt time for display
  const utcToEgyptTime = (utcTime: string): string => {
    console.log('🔄 Converting UTC to Egypt time:', utcTime);
    
    // Create a date object for today with the UTC time
    const today = new Date();
    const todayString = format(today, 'yyyy-MM-dd');
    
    // Create proper UTC datetime string
    const utcDateTimeString = `${todayString}T${utcTime}`;
    console.log('📅 UTC DateTime String:', utcDateTimeString);
    
    // Parse as UTC (Z indicates UTC timezone)
    const utcDateTime = new Date(utcDateTimeString + 'Z');
    console.log('🌐 Parsed UTC DateTime:', utcDateTime);
    
    // Convert from UTC to Egypt timezone
    const egyptDateTime = toZonedTime(utcDateTime, EGYPT_TIMEZONE);
    console.log('🇪🇬 Egypt DateTime:', egyptDateTime);
    
    // Return formatted time as HH:mm
    const egyptTime = format(egyptDateTime, 'HH:mm');
    console.log('✅ Final Egypt time for display:', egyptTime);
    
    return egyptTime;
  };

  // Fetch availability data from database
  const fetchAvailability = async () => {
    if (!selectedDate || !user) return;

    setLoading(true);
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
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

      console.log('📋 Fetched availability data:', data);

      // Generate all possible time slots
      const allSlots = generateTimeSlots();
      
      // Update slots with database data
      const updatedSlots = allSlots.map(slot => {
        const dbSlot = data?.find(d => {
          const convertedTime = utcToEgyptTime(d.time_slot);
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
  };

  // Toggle availability for a time slot
  const toggleAvailability = async (time: string) => {
    if (!selectedDate || !user) return;

    console.log('🎯 Toggling availability for time:', time);

    const slot = timeSlots.find(s => s.time === time);
    if (!slot || slot.isBooked) {
      console.log('❌ Cannot modify slot:', { slot, reason: slot?.isBooked ? 'booked' : 'not found' });
      return; // Can't modify booked slots
    }

    const dateString = selectedDate.toISOString().split('T')[0];
    const utcTime = egyptTimeToUTC(selectedDate, time);

    console.log('💾 Database operation:', { 
      action: slot.isAvailable ? 'remove' : 'add',
      egyptTime: time,
      utcTime,
      dateString 
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
            toast.error('Failed to remove availability');
            return;
          }
          console.log('✅ Successfully removed availability');
        }
      } else {
        // Add availability
        console.log('➕ Adding availability:', {
          teacher_id: user.id,
          date: dateString,
          time_slot: utcTime,
          is_available: true,
          is_booked: false,
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
          toast.error('Failed to add availability');
          return;
        }
        console.log('✅ Successfully added availability');
      }

      // Refresh data
      await fetchAvailability();
      toast.success(slot.isAvailable ? 'Time slot removed' : 'Time slot added');
    } catch (error) {
      console.error('❌ Error toggling availability:', error);
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
