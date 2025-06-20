import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GranularTimeSlot } from '@/types/availability';
import { AvailabilityService } from '@/services/availabilityService';

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

  const runDiagnostics = async (date: Date, teacherType: string) => {
    const dateStr = date.toISOString().split('T')[0];
    
    console.log('=== RUNNING ENHANCED DIAGNOSTICS ===');
    console.log('Diagnostic Parameters:', { dateStr, teacherType });
    
    // Step 1: Check what availability data exists for the date
    console.log('Step 1: Checking all availability for date...');
    const { data: allAvailability } = await supabase
      .from('teacher_availability')
      .select('time_slot, teacher_id, date, is_available, is_booked')
      .eq('date', dateStr)
      .order('time_slot');
    
    console.log('All availability for date:', allAvailability);
    
    // Step 2: Check available (not booked) slots
    console.log('Step 2: Checking available slots...');
    const { data: availableData } = await supabase
      .from('teacher_availability')
      .select('time_slot, teacher_id')
      .eq('date', dateStr)
      .eq('is_available', true)
      .eq('is_booked', false);
    
    console.log('Available slots:', availableData);
    
    // Step 3: Check all teachers by type and status
    console.log('Step 3: Checking teacher profiles...');
    const { data: allTeachers } = await supabase
      .from('profiles')
      .select('id, full_name, teacher_type, status, role')
      .eq('role', 'teacher');
    
    console.log('All teachers:', allTeachers);
    
    const approvedTeachers = allTeachers?.filter(t => t.status === 'approved');
    console.log('Approved teachers:', approvedTeachers);
    
    // Step 4: Check teachers of requested type
    let teachersOfType;
    if (teacherType === 'mixed') {
      teachersOfType = approvedTeachers?.filter(t => 
        ['arabic', 'english', 'mixed'].includes(t.teacher_type)
      );
    } else {
      teachersOfType = approvedTeachers?.filter(t => 
        t.teacher_type === teacherType || t.teacher_type === 'mixed'
      );
    }
    
    console.log(`Teachers matching type ${teacherType}:`, teachersOfType);
    
    // Step 5: Check if any available slots match teacher IDs
    const availableTeacherIds = availableData?.map(a => a.teacher_id) || [];
    const matchingTeacherIds = teachersOfType?.map(t => t.id) || [];
    const intersection = availableTeacherIds.filter(id => matchingTeacherIds.includes(id));
    
    console.log('Available teacher IDs:', availableTeacherIds);
    console.log('Matching teacher IDs:', matchingTeacherIds);
    console.log('Intersection (should have slots):', intersection);
    
    // Build diagnostic message
    let message = `Diagnostic Results for ${teacherType} teachers on ${dateStr}:\n`;
    
    if (!allAvailability || allAvailability.length === 0) {
      message += `❌ No availability data found for date\n`;
    } else {
      message += `✅ Found ${allAvailability.length} total availability records\n`;
    }
    
    if (!availableData || availableData.length === 0) {
      message += `❌ No available (unbooked) slots found\n`;
    } else {
      message += `✅ Found ${availableData.length} available slots\n`;
      const availableTimes = availableData.map(a => a.time_slot).join(', ');
      message += `⏰ Available times: ${availableTimes}\n`;
    }
    
    if (!approvedTeachers || approvedTeachers.length === 0) {
      message += `❌ No approved teachers found in system\n`;
    } else {
      message += `✅ Found ${approvedTeachers.length} approved teachers\n`;
    }
    
    if (!teachersOfType || teachersOfType.length === 0) {
      message += `❌ No approved ${teacherType} teachers found\n`;
    } else {
      message += `✅ Found ${teachersOfType.length} matching ${teacherType} teachers\n`;
      const teacherNames = teachersOfType.map(t => `${t.full_name} (${t.teacher_type})`).join(', ');
      message += `👥 Teachers: ${teacherNames}\n`;
    }
    
    if (intersection.length === 0) {
      message += `❌ No overlap between available slots and matching teachers\n`;
    } else {
      message += `✅ Found ${intersection.length} teachers with available slots\n`;
    }
    
    console.log('Final diagnostic message:', message);
    toast.info(message, { duration: 10000 });
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
        await runDiagnostics(date, teacherType);
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
