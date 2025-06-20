import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GranularTimeSlot } from '@/types/availability';
import { AvailabilityService } from '@/services/availabilityService';
import { convertClientHourToUTC, getTimezoneConfig } from '@/utils/timezoneUtils';

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
  const [availableSlots, setAvailableSlots] = useState<GranularTimeSlot[]>([]);

  const runDiagnostics = async (
    date: Date, 
    teacherType: string, 
    timezone: string, 
    selectedHour: number
  ) => {
    const dateStr = date.toISOString().split('T')[0];
    const timezoneConfig = getTimezoneConfig(timezone);
    
    console.log('=== RUNNING ENHANCED DIAGNOSTICS ===');
    console.log('Diagnostic Parameters:', { dateStr, teacherType, timezone, selectedHour });
    
    if (!timezoneConfig) {
      console.error('Invalid timezone:', timezone);
      return;
    }
    
    // Convert client hour to UTC (same as availability service)
    const utcHour = convertClientHourToUTC(selectedHour, timezoneConfig.offset);
    const startTime = `${String(utcHour).padStart(2, '0')}:00:00`;
    const endHour = (utcHour + 1) % 24;
    const endTime = `${String(endHour).padStart(2, '0')}:00:00`;
    
    console.log('UTC Time Range:', { startTime, endTime, utcHour, timezoneOffset: timezoneConfig.offset });
    
    // Step 1: Check all availability for the date
    console.log('Step 1: Checking all availability for date...');
    const { data: allAvailability } = await supabase
      .from('teacher_availability')
      .select('time_slot, teacher_id, date, is_available, is_booked')
      .eq('date', dateStr)
      .order('time_slot');
    
    console.log('All availability for date:', allAvailability);
    
    // Step 2: Check available slots in specific time range (matching availability service)
    console.log('Step 2: Checking available slots in time range...');
    const { data: availableData, error: availableError } = await supabase
      .from('teacher_availability')
      .select('time_slot, teacher_id')
      .eq('date', dateStr)
      .gte('time_slot', startTime)
      .lt('time_slot', endTime)
      .eq('is_available', true)
      .eq('is_booked', false);
    
    console.log('Available slots in time range:', { data: availableData, error: availableError });
    
    // Step 3: Get teacher IDs from available slots
    const availableTeacherIds = availableData?.map(slot => slot.teacher_id) || [];
    console.log('Teacher IDs from available slots:', availableTeacherIds);
    
    // Step 4: Build teacher type filter - FIXED TO USE CORRECT TEACHER TYPES
    let teacherTypeFilter: string[];
    if (teacherType === 'mixed') {
      // When searching for 'mixed', include all teacher types since mixed teachers can handle any type
      teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
      console.log('Searching for mixed teachers - including all types');
    } else {
      // When searching for specific type, include that type + mixed teachers
      teacherTypeFilter = [teacherType, 'mixed'];
      console.log(`Searching for ${teacherType} teachers - including mixed`);
    }
    
    console.log('Teacher Type Filter:', teacherTypeFilter);
    
    // Step 5: Query teachers with exact same approach as availability service
    console.log('Step 5: Querying teacher profiles with availability service logic...');
    let matchingTeachers = null;
    let teacherError = null;
    
    if (availableTeacherIds.length > 0) {
      const { data: teachers, error } = await supabase
        .from('profiles')
        .select('id, full_name, teacher_type, status, role')
        .in('id', availableTeacherIds)
        .in('teacher_type', teacherTypeFilter)
        .eq('status', 'approved')
        .eq('role', 'teacher');
      
      matchingTeachers = teachers;
      teacherError = error;
    } else {
      matchingTeachers = [];
    }
    
    console.log('Matching teachers result:', { 
      teachers: matchingTeachers, 
      error: teacherError,
      teacherCount: matchingTeachers?.length || 0 
    });
    
    // Build diagnostic message with enhanced details
    let message = `Diagnostic Results for ${teacherType} teachers on ${dateStr}:\n`;
    message += `🕒 Searching time range: ${startTime} - ${endTime} UTC (Client: ${selectedHour}:00 ${timezoneConfig.label})\n`;
    
    if (!allAvailability || allAvailability.length === 0) {
      message += `❌ No availability data found for date\n`;
    } else {
      message += `✅ Found ${allAvailability.length} total availability records\n`;
    }
    
    if (availableError) {
      message += `❌ Error querying availability: ${availableError.message}\n`;
    } else if (!availableData || availableData.length === 0) {
      message += `❌ No available slots found in time range ${startTime}-${endTime}\n`;
    } else {
      message += `✅ Found ${availableData.length} available slots in time range\n`;
      const availableTimes = availableData.map(a => a.time_slot).join(', ');
      message += `⏰ Available times in range: ${availableTimes}\n`;
    }
    
    if (availableTeacherIds.length === 0) {
      message += `❌ No teacher IDs from available slots in time range\n`;
    } else {
      message += `👥 Teacher IDs from slots: ${availableTeacherIds.length} (${availableTeacherIds.slice(0, 3).join(', ')}${availableTeacherIds.length > 3 ? '...' : ''})\n`;
    }
    
    message += `🎯 Teacher type filter: [${teacherTypeFilter.join(', ')}] (FIXED - using correct system teacher types)\n`;
    
    if (teacherError) {
      message += `❌ Error querying teachers: ${teacherError.message}\n`;
    } else if (!matchingTeachers || matchingTeachers.length === 0) {
      message += `❌ No approved ${teacherType} teachers found matching criteria\n`;
    } else {
      message += `✅ Found ${matchingTeachers.length} matching teachers\n`;
      const teacherNames = matchingTeachers.map(t => `${t.full_name} (${t.teacher_type})`).join(', ');
      message += `👥 Teachers: ${teacherNames}\n`;
    }
    
    const finalSlotCount = matchingTeachers?.length || 0;
    if (finalSlotCount === 0) {
      message += `❌ No final matching slots (teachers × time slots)\n`;
    } else {
      message += `✅ Should generate ${finalSlotCount} potential slots\n`;
    }
    
    console.log('Final diagnostic message:', message);
    toast.info(message, { duration: 15000 });
  };

  const checkAvailability = async (
    date: Date,
    timezone: string,
    teacherType: string,
    selectedHour: number
  ) => {
    setLoading(true);
    try {
      console.log('=== CHECKING AVAILABILITY ===');
      console.log('Parameters:', { date: date.toDateString(), timezone, teacherType, selectedHour });
      
      const slots = await AvailabilityService.searchAvailableSlots(
        date,
        timezone,
        teacherType,
        selectedHour
      );
      
      setAvailableSlots(slots);
      
      if (slots.length === 0) {
        console.log('No slots found - running detailed diagnostics...');
        await runDiagnostics(date, teacherType, timezone, selectedHour);
      } else {
        const teacherCount = new Set(slots.map(s => s.teacherId)).size;
        const timeSlots = new Set(slots.map(s => s.clientTimeDisplay)).size;
        const teacherNames = [...new Set(slots.map(s => s.teacherName))].join(', ');
        const successMessage = `Found ${slots.length} slot(s) from ${teacherCount} teacher(s): ${teacherNames}`;
        console.log('Success:', successMessage);
        toast.success(successMessage);
      }
      
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error(`Failed to check availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const bookTrialSession = async (
    bookingData: BookingData,
    selectedDate: Date,
    selectedSlot: GranularTimeSlot,
    teacherType: string,
    isMultiStudent: boolean = false
  ) => {
    try {
      console.log('Booking trial session:', { bookingData, selectedDate, selectedSlot, teacherType });
      
      const dateStr = selectedDate.toISOString().split('T')[0];
      
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
            assigned_teacher_id: selectedSlot.teacherId,
            assigned_sales_agent_id: user.id,
            trial_date: dateStr,
            trial_time: selectedSlot.utcStartTime,
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
            scheduled_time: selectedSlot.utcStartTime,
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
          assigned_teacher_id: selectedSlot.teacherId,
          assigned_sales_agent_id: user.id,
          trial_date: dateStr,
          trial_time: selectedSlot.utcStartTime,
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
            scheduled_time: selectedSlot.utcStartTime,
            status: 'scheduled'
          }]);

        if (sessionError) {
          console.error('Error creating session:', sessionError);
          toast.error('Failed to create trial session');
          return false;
        }

        toast.success(`Trial session booked successfully for ${bookingData.studentName}!`);
      }

      // Mark the teacher slot as booked using the exact time_slot from database
      await supabase
        .from('teacher_availability')
        .update({ is_booked: true })
        .eq('teacher_id', selectedSlot.teacherId)
        .eq('date', dateStr)
        .eq('time_slot', selectedSlot.utcStartTime); // Use exact database time value

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
