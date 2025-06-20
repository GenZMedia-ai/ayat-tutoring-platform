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

  // Helper function to group slots by time for display
  const groupSlotsByTime = (slots: GranularTimeSlot[]) => {
    if (!slots) return {};
    return slots.reduce((acc, slot) => {
      const key = slot.clientTimeDisplay;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(slot);
      return acc;
    }, {} as Record<string, GranularTimeSlot[]>);
  };

  const runDiagnostics = async (
    date: Date, 
    teacherType: string, 
    timezone: string, 
    selectedHour: number
  ) => {
    const dateStr = date.toISOString().split('T')[0];
    const timezoneConfig = getTimezoneConfig(timezone);
    
    console.log('=== RUNNING ENHANCED DIAGNOSTICS (Using Secure RPC) ===');
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
    
    // Build teacher type filter - FIXED TO USE CORRECT TEACHER TYPES
    let teacherTypeFilter: string[];
    if (teacherType === 'mixed') {
      teacherTypeFilter = ['kids', 'adult', 'mixed', 'expert'];
      console.log('Searching for mixed teachers - including all types');
    } else {
      teacherTypeFilter = [teacherType, 'mixed'];
      console.log(`Searching for ${teacherType} teachers - including mixed`);
    }
    
    console.log('Teacher Type Filter:', teacherTypeFilter);
    
    // Step 1: Test the secure RPC function directly
    console.log('Step 1: Testing secure RPC function...');
    const { data: rpcResults, error: rpcError } = await supabase
      .rpc('search_available_teachers', {
        p_date: dateStr,
        p_start_time: startTime,
        p_end_time: endTime,
        p_teacher_types: teacherTypeFilter
      });
    
    console.log('Secure RPC result:', { data: rpcResults, error: rpcError });
    
    // Build diagnostic message with enhanced details
    let message = `Diagnostic Results for ${teacherType} teachers on ${dateStr}:\n`;
    message += `🕒 Searching time range: ${startTime} - ${endTime} UTC (Client: ${selectedHour}:00 ${timezoneConfig.label})\n`;
    message += `🎯 Teacher type filter: [${teacherTypeFilter.join(', ')}] (FIXED - using correct system teacher types)\n`;
    message += `🔐 Using secure RPC function to bypass RLS issues\n`;
    
    if (rpcError) {
      message += `❌ Error calling secure RPC: ${rpcError.message}\n`;
    } else if (!rpcResults || rpcResults.length === 0) {
      message += `❌ No available teachers found via secure RPC\n`;
      message += `💡 This means either no availability exists or no teachers match the criteria\n`;
    } else {
      message += `✅ Found ${rpcResults.length} teacher-slot combinations via secure RPC\n`;
      const teacherNames = [...new Set(rpcResults.map((r: any) => r.teacher_name))];
      message += `👥 Teachers: ${teacherNames.slice(0, 3).join(', ')}${teacherNames.length > 3 ? ` +${teacherNames.length - 3} more` : ''}\n`;
      const timeSlots = [...new Set(rpcResults.map((r: any) => r.time_slot))];
      message += `⏰ Time slots: ${timeSlots.join(', ')}\n`;
    }
    
    const finalSlotCount = rpcResults?.length || 0;
    if (finalSlotCount === 0) {
      message += `❌ No final matching slots\n`;
    } else {
      message += `✅ RLS issue resolved - ${finalSlotCount} slots found via secure function\n`;
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
      console.log('=== CHECKING AVAILABILITY (Using Secure RPC) ===');
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
        const groupedSlots = groupSlotsByTime(slots);
        const timeSlotCount = Object.keys(groupedSlots).length;
        const successMessage = `Found ${timeSlotCount} time slot(s) with ${teacherCount} teacher(s) available (RLS fix working!)`;
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
    selectedSlots: GranularTimeSlot[], // Changed to accept slot groups for round-robin
    teacherType: string,
    isMultiStudent: boolean = false
  ) => {
    try {
      console.log('Booking trial session:', { bookingData, selectedDate, selectedSlots: selectedSlots.length, teacherType });
      
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Get current user (sales agent)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to book sessions');
        return false;
      }

      // Round-robin teacher selection from available slots
      if (!selectedSlots || selectedSlots.length === 0) {
        toast.error("No available teachers for this slot.");
        return false;
      }

      const availableTeacherIds = selectedSlots.map(slot => slot.teacherId);

      // Find teacher who was booked longest ago (or never booked)
      const { data: teacherToBook, error: teacherSelectError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', availableTeacherIds)
        .order('last_booked_at', { ascending: true, nullsFirst: true })
        .limit(1)
        .single();

      if (teacherSelectError || !teacherToBook) {
        console.error('Error selecting teacher:', teacherSelectError);
        toast.error('Could not assign a teacher via round-robin.');
        return false;
      }

      const selectedTeacherId = teacherToBook.id;
      const selectedSlot = selectedSlots.find(s => s.teacherId === selectedTeacherId)!;

      console.log('Round-robin selected teacher:', teacherToBook.full_name, 'for slot:', selectedSlot.utcStartTime);

      if (isMultiStudent && bookingData.students) {
        // Multi-student booking logic
        const newStudents = [];
        
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

        // Link ALL students to the session using junction table
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

        toast.success(`Family trial session booked successfully! Students: ${newStudents.map(s => s.name).join(', ')} with teacher ${teacherToBook.full_name}`);
      } else {
        // Single student booking
        const { data: uniqueIdData, error: uniqueIdError } = await supabase
          .rpc('generate_student_unique_id');
        
        if (uniqueIdError) {
          console.error('Error generating unique ID:', uniqueIdError);
          toast.error('Failed to generate student ID');
          return false;
        }

        const studentData = {
          unique_id: uniqueIdData,
          name: bookingData.studentName,
          age: bookingData.age,
          phone: bookingData.phone,
          country: bookingData.country,
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

        // Link student to session using junction table
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

        toast.success(`Trial session booked successfully for ${bookingData.studentName} with teacher ${teacherToBook.full_name}!`);
      }

      // Mark the teacher slot as booked
      await supabase
        .from('teacher_availability')
        .update({ is_booked: true })
        .eq('teacher_id', selectedTeacherId)
        .eq('date', dateStr)
        .eq('time_slot', selectedSlot.utcStartTime);

      // Update teacher's last_booked_at for round-robin tracking
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
    groupSlotsByTime,
    checkAvailability,
    bookTrialSession
  };
};
