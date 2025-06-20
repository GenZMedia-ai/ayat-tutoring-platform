
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { convertToUTCRange, TIMEZONES } from '@/constants/timeSlots';

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
    selectedHour: number
  ) => {
    setLoading(true);
    try {
      console.log('=== COMPREHENSIVE AVAILABILITY DEBUG ===');
      console.log('Input Parameters:', { 
        date: date.toISOString(), 
        timezone, 
        teacherType, 
        selectedHour,
        dateString: date.toISOString().split('T')[0]
      });
      
      const dateStr = date.toISOString().split('T')[0];
      
      // Get timezone configuration
      const timezoneConfig = TIMEZONES.find(tz => tz.value === timezone);
      if (!timezoneConfig) {
        console.error('Invalid timezone:', timezone);
        toast.error('Invalid timezone selected');
        setAvailableSlots([]);
        return;
      }

      console.log('Timezone Config:', timezoneConfig);

      // Convert client hour to UTC range with debugging
      const { startTime, endTime, crossesMidnight } = convertToUTCRange(selectedHour, timezoneConfig.offset);
      console.log('UTC Conversion Result:', { 
        clientHour: selectedHour,
        timezoneOffset: timezoneConfig.offset,
        startTime, 
        endTime, 
        crossesMidnight 
      });

      // Build availability query
      let availabilityQuery = supabase
        .from('teacher_availability')
        .select('teacher_id, time_slot')
        .eq('date', dateStr)
        .eq('is_available', true)
        .eq('is_booked', false);

      if (crossesMidnight) {
        console.log('Handling midnight crossing with OR query');
        availabilityQuery = availabilityQuery.or(`time_slot.gte.${startTime},time_slot.lt.${endTime}`);
      } else {
        console.log('Normal time range query');
        availabilityQuery = availabilityQuery.gte('time_slot', startTime).lt('time_slot', endTime);
      }

      const { data: availability, error: availabilityError } = await availabilityQuery;

      if (availabilityError) {
        console.error('Availability query error:', availabilityError);
        toast.error('Failed to check availability');
        setAvailableSlots([]);
        return;
      }

      console.log('Raw availability data:', availability);
      console.log('Total availability records found:', availability?.length || 0);

      if (!availability || availability.length === 0) {
        console.log('=== NO AVAILABILITY DATA FOUND ===');
        console.log('Searching for ANY availability on this date...');
        
        // Fallback: Check what availability exists for this date
        const { data: allDayAvailability } = await supabase
          .from('teacher_availability')
          .select('time_slot, teacher_id, is_available, is_booked')
          .eq('date', dateStr);
        
        console.log('All availability for this date:', allDayAvailability);
        
        setAvailableSlots([]);
        toast.info('No available time slots found for the selected hour');
        return;
      }

      // Get unique teacher IDs
      const teacherIds: string[] = Array.from(
        new Set(availability.map(a => a.teacher_id as string))
      );
      console.log('Unique teacher IDs with availability:', teacherIds);

      // Enhanced teacher filtering with fallback logic
      console.log('=== TEACHER FILTERING PHASE ===');
      console.log('Requested teacher type:', teacherType);

      // First try: exact match
      let { data: qualifiedTeachers, error: teachersError } = await supabase
        .from('profiles')
        .select('id, full_name, teacher_type, status, role')
        .in('id', teacherIds)
        .eq('teacher_type', teacherType)
        .eq('status', 'approved')
        .eq('role', 'teacher');

      if (teachersError) {
        console.error('Teachers query error:', teachersError);
        toast.error('Failed to check teacher qualifications');
        setAvailableSlots([]);
        return;
      }

      console.log('Exact match teachers:', qualifiedTeachers);

      // Fallback: if no exact match and searching for specific type, also include 'mixed' teachers
      if ((!qualifiedTeachers || qualifiedTeachers.length === 0) && teacherType !== 'mixed') {
        console.log('No exact match found, searching for mixed teachers as fallback...');
        
        const { data: mixedTeachers } = await supabase
          .from('profiles')
          .select('id, full_name, teacher_type, status, role')
          .in('id', teacherIds)
          .eq('teacher_type', 'mixed')
          .eq('status', 'approved')
          .eq('role', 'teacher');

        console.log('Mixed teachers found:', mixedTeachers);
        
        if (mixedTeachers && mixedTeachers.length > 0) {
          qualifiedTeachers = [...(qualifiedTeachers || []), ...mixedTeachers];
          console.log('Combined teachers (exact + mixed):', qualifiedTeachers);
        }
      }

      // Additional debugging: show all teachers for this time slot
      const { data: allTeachers } = await supabase
        .from('profiles')
        .select('id, full_name, teacher_type, status, role')
        .in('id', teacherIds);
      
      console.log('ALL teachers with availability (regardless of type/status):', allTeachers);

      const finalTeacherIds = qualifiedTeachers?.map(t => t.id) || [];
      console.log('Final qualified teacher IDs:', finalTeacherIds);
      
      const slots: AvailableSlot[] = [];
      if (finalTeacherIds.length > 0) {
        const timezoneLabel = timezoneConfig.label.split(' ')[0];
        const hourLabel = selectedHour > 12 ? `${selectedHour - 12}:00 PM` : `${selectedHour}:00 AM`;
        
        slots.push({
          timeSlot: `${hourLabel} (${timezoneLabel})`,
          availableTeachers: finalTeacherIds.length,
          teacherIds: finalTeacherIds
        });
        
        console.log('SUCCESS: Created slot:', slots[0]);
      }
      
      setAvailableSlots(slots);
      
      if (slots.length === 0) {
        console.log('=== FINAL ANALYSIS: NO QUALIFIED TEACHERS ===');
        console.log('Search criteria:');
        console.log('- Date:', dateStr);
        console.log('- Time range:', startTime, 'to', endTime);
        console.log('- Teacher type:', teacherType);
        console.log('- Available slots found:', availability.length);
        console.log('- Teachers with availability:', teacherIds.length);
        console.log('- Qualified teachers:', qualifiedTeachers?.length || 0);
        
        const teacherTypeText = teacherType === 'mixed' ? 'mixed' : `${teacherType} or mixed`;
        toast.info(`No qualified ${teacherTypeText} teachers available for the selected hour`);
      } else {
        const teacherTypeText = qualifiedTeachers?.some(t => t.teacher_type === 'mixed') ? 
          `${teacherType}/mixed` : teacherType;
        toast.success(`Found ${slots[0].availableTeachers} qualified ${teacherTypeText} teacher(s)`);
        console.log('=== SUCCESS ===');
        console.log('Found teachers:', qualifiedTeachers?.map(t => `${t.full_name} (${t.teacher_type})`));
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
    selectedSlot: string,
    teacherType: string,
    isMultiStudent: boolean = false
  ) => {
    try {
      console.log('Booking trial session:', { bookingData, selectedDate, selectedSlot, teacherType });
      
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // For booking, we'll use the first available slot in the hour
      // This is a simplified approach - in a real system you might want more specific slot selection
      const defaultTime = '16:00:00'; // Default to 4 PM UTC for booking
      
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
          trial_time_param: defaultTime
        });

      if (assignError || !teacherId) {
        console.error('Error assigning teacher:', assignError);
        toast.error('No available teachers for this slot');
        return false;
      }

      if (isMultiStudent && bookingData.students) {
        // Multi-student booking logic
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
            trial_time: defaultTime,
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
            student_id: students[0].id,
            scheduled_date: dateStr,
            scheduled_time: defaultTime,
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
          trial_time: defaultTime,
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
            scheduled_time: defaultTime,
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
        .eq('time_slot', defaultTime);

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
