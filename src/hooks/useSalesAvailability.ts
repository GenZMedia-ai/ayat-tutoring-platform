
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AvailableSlot {
  timeSlot: string;
  availableTeachers: number;
  teacherIds: string[];
}

export interface BookingData {
  studentName: string;
  country: string;
  phone: string;
  platform: 'zoom' | 'google-meet';
  age: number;
  notes?: string;
  parentName?: string;
  students?: { name: string; age: number }[];
}

// Predefined time slots with 12-hour display format
export const TIME_SLOTS = [
  { value: '14:00:00', label: '2:00 PM' },
  { value: '15:00:00', label: '3:00 PM' },
  { value: '16:00:00', label: '4:00 PM' },
  { value: '17:00:00', label: '5:00 PM' },
  { value: '18:00:00', label: '6:00 PM' },
  { value: '19:00:00', label: '7:00 PM' },
  { value: '20:00:00', label: '8:00 PM' },
  { value: '21:00:00', label: '9:00 PM' },
  { value: '22:00:00', label: '10:00 PM' },
  { value: '23:00:00', label: '11:00 PM' }
];

export const useSalesAvailability = () => {
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);

  const checkAvailability = async (
    date: Date,
    timezone: string,
    teacherType: string,
    selectedTime: string
  ) => {
    setLoading(true);
    try {
      console.log('Checking availability for:', { date, timezone, teacherType, selectedTime });
      
      const dateStr = date.toISOString().split('T')[0];
      
      // Query teacher availability for the specific time slot with proper join syntax
      const { data: availability, error } = await supabase
        .from('teacher_availability')
        .select(`
          teacher_id,
          profiles!inner(
            teacher_type,
            status,
            role
          )
        `)
        .eq('date', dateStr)
        .eq('time_slot', selectedTime)
        .eq('is_available', true)
        .eq('is_booked', false)
        .eq('profiles.teacher_type', teacherType)
        .eq('profiles.status', 'approved')
        .eq('profiles.role', 'teacher');

      if (error) {
        console.error('Error fetching availability:', error);
        toast.error('Failed to check availability');
        setAvailableSlots([]);
        return;
      }

      console.log('Availability data:', availability);

      const teacherIds = availability?.map(a => a.teacher_id) || [];
      
      const slots: AvailableSlot[] = [];
      if (teacherIds.length > 0) {
        // Find the display label for the selected time
        const timeSlot = TIME_SLOTS.find(slot => slot.value === selectedTime);
        const displayTime = timeSlot ? timeSlot.label : selectedTime;
        
        slots.push({
          timeSlot: displayTime,
          availableTeachers: teacherIds.length,
          teacherIds
        });
      }
      
      setAvailableSlots(slots);
      
      if (slots.length === 0) {
        toast.info('No available teachers found for the selected time slot');
      } else {
        toast.success(`Found ${slots[0].availableTeachers} available teacher(s)`);
      }
      
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('Failed to check availability');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const bookTrialSession = async (
    bookingData: BookingData,
    selectedDate: Date,
    selectedTime: string,
    teacherType: string,
    isMultiStudent: boolean = false
  ) => {
    try {
      console.log('Booking trial session:', { bookingData, selectedDate, selectedTime, teacherType });
      
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Convert display time back to database time format if needed
      const timeSlot = TIME_SLOTS.find(slot => slot.label === selectedTime);
      const timeStr = timeSlot ? timeSlot.value : selectedTime;
      
      // Get current user (sales agent)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to book sessions');
        return false;
      }

      // Generate unique ID
      const { data: uniqueIdData, error: uniqueIdError } = await supabase
        .rpc('generate_student_unique_id');
      
      if (uniqueIdError) {
        console.error('Error generating unique ID:', uniqueIdError);
        toast.error('Failed to generate student ID');
        return false;
      }

      // Assign teacher using round-robin
      const { data: teacherId, error: assignError } = await supabase
        .rpc('assign_teacher_round_robin', {
          teacher_type_param: teacherType,
          trial_date_param: dateStr,
          trial_time_param: timeStr
        });

      if (assignError || !teacherId) {
        console.error('Error assigning teacher:', assignError);
        toast.error('No available teachers for this slot');
        return false;
      }

      if (isMultiStudent && bookingData.students) {
        // Multi-student booking
        const students = [];
        
        for (let i = 0; i < bookingData.students.length; i++) {
          const student = bookingData.students[i];
          const { data: studentUniqueId } = await supabase.rpc('generate_student_unique_id');
          
          const studentData = {
            unique_id: studentUniqueId,
            name: student.name,
            age: student.age,
            phone: bookingData.phone,
            country: bookingData.country,
            platform: bookingData.platform,
            notes: bookingData.notes || null,
            parent_name: bookingData.parentName,
            assigned_teacher_id: teacherId,
            assigned_sales_agent_id: user.id,
            trial_date: dateStr,
            trial_time: timeStr,
            teacher_type: teacherType,
            status: 'pending'
          };

          const { data: newStudent, error: studentError } = await supabase
            .from('students')
            .insert([studentData])
            .select()
            .single();

          if (studentError) {
            console.error('Error creating student:', studentError);
            toast.error(`Failed to create student record for ${student.name}`);
            return false;
          }

          students.push(newStudent);
        }

        // Create one session for the family
        const { error: sessionError } = await supabase
          .from('sessions')
          .insert([{
            student_id: students[0].id, // Use first student as primary
            scheduled_date: dateStr,
            scheduled_time: timeStr,
            status: 'scheduled'
          }]);

        if (sessionError) {
          console.error('Error creating session:', sessionError);
          toast.error('Failed to create trial session');
          return false;
        }

        toast.success(`Family trial session booked successfully! Students: ${students.map(s => s.name).join(', ')}`);
      } else {
        // Single student booking
        const studentData = {
          unique_id: uniqueIdData,
          name: bookingData.studentName,
          age: bookingData.age,
          phone: bookingData.phone,
          country: bookingData.country,
          platform: bookingData.platform,
          notes: bookingData.notes || null,
          assigned_teacher_id: teacherId,
          assigned_sales_agent_id: user.id,
          trial_date: dateStr,
          trial_time: timeStr,
          teacher_type: teacherType,
          status: 'pending'
        };

        const { data: newStudent, error: studentError } = await supabase
          .from('students')
          .insert([studentData])
          .select()
          .single();

        if (studentError) {
          console.error('Error creating student:', studentError);
          toast.error('Failed to create student record');
          return false;
        }

        // Create trial session
        const { error: sessionError } = await supabase
          .from('sessions')
          .insert([{
            student_id: newStudent.id,
            scheduled_date: dateStr,
            scheduled_time: timeStr,
            status: 'scheduled'
          }]);

        if (sessionError) {
          console.error('Error creating session:', sessionError);
          toast.error('Failed to create trial session');
          return false;
        }

        toast.success(`Trial session booked successfully for ${bookingData.studentName}!`);
      }

      // Mark the teacher slot as booked
      await supabase
        .from('teacher_availability')
        .update({ is_booked: true })
        .eq('teacher_id', teacherId)
        .eq('date', dateStr)
        .eq('time_slot', timeStr);

      return true;
    } catch (error) {
      console.error('Error booking trial session:', error);
      toast.error('Failed to book trial session');
      return false;
    }
  };

  return {
    loading,
    availableSlots,
    checkAvailability,
    bookTrialSession
  };
};
