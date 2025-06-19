
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

export const useSalesAvailability = () => {
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);

  const checkAvailability = async (
    date: Date,
    timezone: string,
    teacherType: string,
    startHour: number,
    endHour: number
  ) => {
    setLoading(true);
    try {
      console.log('Checking availability for:', { date, timezone, teacherType, startHour, endHour });
      
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate time slots for the range
      const slots: AvailableSlot[] = [];
      for (let hour = startHour; hour < endHour; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        
        // Query teacher availability for this specific time slot
        const { data: availability, error } = await supabase
          .from('teacher_availability')
          .select(`
            teacher_id,
            profiles!inner(teacher_type, status, role)
          `)
          .eq('date', dateStr)
          .eq('time_slot', timeSlot)
          .eq('is_available', true)
          .eq('is_booked', false)
          .eq('profiles.teacher_type', teacherType)
          .eq('profiles.status', 'approved')
          .eq('profiles.role', 'teacher');

        if (error) {
          console.error('Error fetching availability:', error);
          continue;
        }

        const teacherIds = availability?.map(a => a.teacher_id) || [];
        
        if (teacherIds.length > 0) {
          slots.push({
            timeSlot: `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`,
            availableTeachers: teacherIds.length,
            teacherIds
          });
        }
      }
      
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('Failed to check availability');
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
      const timeStr = selectedTime.split('-')[0] + ':00';
      
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
