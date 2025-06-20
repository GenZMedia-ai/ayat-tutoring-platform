
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GranularTimeSlot } from '@/types/availability';
import { GroupedTimeSlot, RoundRobinBookingData } from '@/types/groupedSlots';
import { AvailabilityService } from '@/services/availabilityService';
import { convertClientTimeToServer, getTimezoneConfig } from '@/utils/timezoneUtils';

export const useSalesAvailability = () => {
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<GranularTimeSlot[]>([]);
  const [groupedSlots, setGroupedSlots] = useState<GroupedTimeSlot[]>([]);

  // Helper function to group slots by time
  const groupSlotsByTime = (slots: GranularTimeSlot[]): GroupedTimeSlot[] => {
    if (!slots || slots.length === 0) return [];

    const grouped = slots.reduce((acc, slot) => {
      const key = slot.clientTimeDisplay;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(slot);
      return acc;
    }, {} as Record<string, GranularTimeSlot[]>);

    return Object.entries(grouped).map(([timeDisplay, slotsInGroup]) => {
      const firstSlot = slotsInGroup[0];
      return {
        timeDisplay,
        egyptTimeDisplay: firstSlot.egyptTimeDisplay,
        availableTeachers: slotsInGroup.length,
        slots: slotsInGroup,
        utcStartTime: firstSlot.utcStartTime,
        utcEndTime: firstSlot.utcEndTime,
      };
    });
  };

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
    
    // Convert client hour to UTC using new timezone utils
    const { utcTimeString, utcHour } = convertClientTimeToServer(date, selectedHour, timezone);
    const endHour = (utcHour + 1) % 24;
    const endTime = `${String(endHour).padStart(2, '0')}:00:00`;
    
    console.log('UTC Time Range:', { startTime: utcTimeString, endTime, utcHour, timezone: timezoneConfig.iana });
    
    // Step 1: Check all availability for the date
    console.log('Step 1: Checking all availability for date...');
    const { data: allAvailability } = await supabase
      .from('teacher_availability')
      .select('time_slot, teacher_id, date, is_available, is_booked')
      .eq('date', dateStr)
      .order('time_slot');
    
    console.log('All availability for date:', allAvailability);
    
    // Step 2: Check available slots in specific time range
    console.log('Step 2: Checking available slots in time range...');
    const { data: availableData, error: availableError } = await supabase
      .from('teacher_availability')
      .select('time_slot, teacher_id')
      .eq('date', dateStr)
      .gte('time_slot', utcTimeString)
      .lt('time_slot', endTime)
      .eq('is_available', true)
      .eq('is_booked', false);
    
    console.log('Available slots in time range:', { data: availableData, error: availableError });
    
    // Enhanced diagnostic message
    let message = `Diagnostic Results for ${teacherType} teachers on ${dateStr}:\n`;
    message += `🕒 Searching time range: ${utcTimeString} - ${endTime} UTC (Client: ${selectedHour}:00 ${timezoneConfig.label})\n`;
    
    if (!allAvailability || allAvailability.length === 0) {
      message += `❌ No availability data found for date\n`;
    } else {
      message += `✅ Found ${allAvailability.length} total availability records\n`;
    }
    
    if (availableError) {
      message += `❌ Error querying availability: ${availableError.message}\n`;
    } else if (!availableData || availableData.length === 0) {
      message += `❌ No available slots found in time range ${utcTimeString}-${endTime}\n`;
    } else {
      message += `✅ Found ${availableData.length} available slots in time range\n`;
      const teacherCount = new Set(availableData.map(a => a.teacher_id)).size;
      message += `👥 Available teachers: ${teacherCount}\n`;
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
      console.log('=== CHECKING AVAILABILITY WITH NEW TIMEZONE LOGIC ===');
      console.log('Parameters:', { date: date.toDateString(), timezone, teacherType, selectedHour });
      
      const slots = await AvailabilityService.searchAvailableSlots(
        date,
        timezone,
        teacherType,
        selectedHour
      );
      
      setAvailableSlots(slots);
      
      // Group the slots by time
      const grouped = groupSlotsByTime(slots);
      setGroupedSlots(grouped);
      
      if (slots.length === 0) {
        console.log('No slots found - running detailed diagnostics...');
        await runDiagnostics(date, teacherType, timezone, selectedHour);
      } else {
        const teacherCount = new Set(slots.map(s => s.teacherId)).size;
        const timeSlotCount = grouped.length;
        const successMessage = `Found ${timeSlotCount} time slot(s) with ${teacherCount} total teacher(s) available`;
        console.log('Success:', successMessage);
        toast.success(successMessage);
      }
      
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error(`Failed to check availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAvailableSlots([]);
      setGroupedSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const selectTeacherRoundRobin = async (availableTeacherIds: string[]): Promise<string | null> => {
    try {
      // Find teacher who was booked longest ago (or never booked)
      const { data: teacherToBook, error } = await supabase
        .from('profiles')
        .select('id, full_name, last_booked_at')
        .in('id', availableTeacherIds)
        .order('last_booked_at', { ascending: true, nullsFirst: true })
        .limit(1)
        .single();

      if (error || !teacherToBook) {
        console.error('Error selecting teacher via round-robin:', error);
        return null;
      }

      console.log('Round-robin selected teacher:', {
        id: teacherToBook.id,
        name: teacherToBook.full_name,
        lastBookedAt: teacherToBook.last_booked_at
      });

      return teacherToBook.id;
    } catch (error) {
      console.error('Round-robin selection failed:', error);
      return null;
    }
  };

  const bookTrialSession = async (
    bookingData: RoundRobinBookingData,
    selectedDate: Date,
    selectedGroupedSlot: GroupedTimeSlot,
    teacherType: string,
    isMultiStudent: boolean = false
  ) => {
    try {
      console.log('Booking trial session with round-robin:', { 
        bookingData, 
        selectedDate, 
        selectedGroupedSlot, 
        teacherType, 
        isMultiStudent 
      });
      
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Get current user (sales agent)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to book sessions');
        return false;
      }

      // Round-robin teacher selection
      const availableTeacherIds = selectedGroupedSlot.slots.map(slot => slot.teacherId);
      const selectedTeacherId = await selectTeacherRoundRobin(availableTeacherIds);
      
      if (!selectedTeacherId) {
        toast.error('Could not assign a teacher via round-robin');
        return false;
      }

      const selectedSlot = selectedGroupedSlot.slots.find(s => s.teacherId === selectedTeacherId)!;

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
        const newStudents = [];
        
        // Create all student records
        for (let i = 0; i < bookingData.students.length; i++) {
          const student = bookingData.students[i];
          const { data: studentUniqueId } = await supabase.rpc('generate_student_unique_id');
          
          const studentData = {
            unique_id: studentUniqueId,
            name: student.name,
            age: student.age,
            phone: bookingData.phone,
            country: 'Multi', // Will be derived from phone number
            platform: bookingData.platform,
            notes: bookingData.notes || null,
            parent_name: bookingData.parentName,
            assigned_teacher_id: selectedTeacherId,
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

          newStudents.push(newStudent);
        }

        // Create one session for the family
        const { data: newSession, error: sessionError } = await supabase
          .from('sessions')
          .insert([{
            scheduled_date: dateStr,
            scheduled_time: selectedSlot.utcStartTime,
            status: 'scheduled'
          }])
          .select()
          .single();

        if (sessionError || !newSession) {
          console.error('Error creating session:', sessionError);
          toast.error('Failed to create trial session');
          return false;
        }

        // Link all students to the session
        const sessionStudentLinks = newStudents.map(student => ({
          session_id: newSession.id,
          student_id: student.id
        }));

        const { error: linkError } = await supabase
          .from('session_students')
          .insert(sessionStudentLinks);

        if (linkError) {
          console.error('Error linking students to session:', linkError);
          toast.error('Failed to link students to session');
          return false;
        }

        toast.success(`Family trial session booked successfully! Students: ${newStudents.map(s => s.name).join(', ')}`);
      } else {
        // Single student booking
        const studentData = {
          unique_id: uniqueIdData,
          name: bookingData.studentName,
          age: bookingData.age,
          phone: bookingData.phone,
          country: 'Single', // Will be derived from phone number
          platform: bookingData.platform,
          notes: bookingData.notes || null,
          assigned_teacher_id: selectedTeacherId,
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
        const { data: newSession, error: sessionError } = await supabase
          .from('sessions')
          .insert([{
            scheduled_date: dateStr,
            scheduled_time: selectedSlot.utcStartTime,
            status: 'scheduled'
          }])
          .select()
          .single();

        if (sessionError || !newSession) {
          console.error('Error creating session:', sessionError);
          toast.error('Failed to create trial session');
          return false;
        }

        // Link student to session
        const { error: linkError } = await supabase
          .from('session_students')
          .insert([{
            session_id: newSession.id,
            student_id: newStudent.id
          }]);

        if (linkError) {
          console.error('Error linking student to session:', linkError);
          toast.error('Failed to link student to session');
          return false;
        }

        toast.success(`Trial session booked successfully for ${bookingData.studentName}!`);
      }

      // Mark the teacher slot as booked
      await supabase
        .from('teacher_availability')
        .update({ is_booked: true })
        .eq('teacher_id', selectedTeacherId)
        .eq('date', dateStr)
        .eq('time_slot', selectedSlot.utcStartTime);

      // Update teacher's last_booked_at for round-robin
      await supabase
        .from('profiles')
        .update({ last_booked_at: new Date().toISOString() })
        .eq('id', selectedTeacherId);

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
    groupedSlots,
    checkAvailability,
    bookTrialSession
  };
};
