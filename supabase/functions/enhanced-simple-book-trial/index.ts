
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ENHANCED-BOOK-TRIAL] ${step}${detailsStr}`);
};

const sendTelegramNotification = async (payload: any) => {
  try {
    const response = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-notifications`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
        },
        body: JSON.stringify(payload)
      }
    );
    
    if (!response.ok) {
      logStep("⚠️ Failed to send notification", { status: response.status });
    } else {
      logStep("✅ Notification sent successfully", { type: payload.notification_type });
    }
  } catch (error) {
    logStep("❌ Notification error", { error: error.message });
  }
};

serve(async (req) => {
  try {
    logStep("🔥 ENHANCED TRIAL BOOKING SERVICE STARTED");

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const requestData = await req.json();
    const { 
      bookingData, 
      isMultiStudent, 
      selectedDate, 
      utcStartTime, 
      teacherType, 
      teacherId,
      isFamily = false 
    } = requestData;

    logStep("📋 Booking request received", { 
      isMultiStudent, 
      isFamily, 
      teacherType,
      selectedDate 
    });

    // Use appropriate booking function
    let result;
    if (isFamily) {
      result = await supabaseClient.rpc('book_family_trial_session', {
        p_booking_data: bookingData,
        p_selected_date: selectedDate,
        p_utc_start_time: utcStartTime,
        p_teacher_type: teacherType,
        p_teacher_id: teacherId
      });
    } else {
      result = await supabaseClient.rpc('simple_book_trial_session', {
        p_booking_data: bookingData,
        p_is_multi_student: isMultiStudent,
        p_selected_date: selectedDate,
        p_utc_start_time: utcStartTime,
        p_teacher_type: teacherType,
        p_teacher_id: teacherId
      });
    }

    if (result.error) {
      throw result.error;
    }

    const bookingResult = result.data;
    logStep("✅ Booking successful", { 
      sessionId: bookingResult.session_id,
      teacherName: bookingResult.teacher_name 
    });

    // Get teacher details for notification
    const { data: teacherData } = await supabaseClient
      .from('profiles')
      .select('full_name, phone')
      .eq('id', teacherId)
      .single();

    if (teacherData && teacherData.phone) {
      // Send teacher assignment notification
      const notificationPayload = {
        notification_type: 'teacher_new_assignment',
        recipient_phone: teacherData.phone,
        recipient_name: teacherData.full_name,
        recipient_role: 'teacher',
        data: {
          student_name: isFamily ? bookingResult.student_names : bookingData.studentName || bookingResult.student_names,
          student_age: isFamily ? 'Multiple' : bookingData.age,
          trial_date: selectedDate,
          trial_time: utcStartTime,
          platform: bookingData.platform,
          is_family: isFamily,
          student_count: isFamily ? bookingResult.student_count : 1
        },
        priority: 'high'
      };

      // Send notification asynchronously
      sendTelegramNotification(notificationPayload);

      // Schedule reminder notifications (1 hour and 3 hours before trial)
      const trialDateTime = new Date(`${selectedDate}T${utcStartTime}`);
      const oneHourBefore = new Date(trialDateTime.getTime() - 60 * 60 * 1000);
      const threeHoursBefore = new Date(trialDateTime.getTime() - 3 * 60 * 60 * 1000);

      // Queue 3-hour reminder
      if (threeHoursBefore > new Date()) {
        await supabaseClient.rpc('queue_notification', {
          p_notification_type: 'teacher_reminder_3h',
          p_recipient_phone: teacherData.phone,
          p_recipient_name: teacherData.full_name,
          p_recipient_role: 'teacher',
          p_payload: {
            student_name: isFamily ? bookingResult.student_names : bookingData.studentName || bookingResult.student_names,
            trial_date: selectedDate,
            trial_time: utcStartTime
          },
          p_scheduled_for: threeHoursBefore.toISOString()
        });
      }

      // Queue 1-hour reminder
      if (oneHourBefore > new Date()) {
        await supabaseClient.rpc('queue_notification', {
          p_notification_type: 'teacher_reminder_1h',
          p_recipient_phone: teacherData.phone,
          p_recipient_name: teacherData.full_name,
          p_recipient_role: 'teacher',
          p_payload: {
            student_name: isFamily ? bookingResult.student_names : bookingData.studentName || bookingResult.student_names,
            trial_date: selectedDate,
            trial_time: utcStartTime
          },
          p_scheduled_for: oneHourBefore.toISOString()
        });
      }

      logStep("📅 Reminder notifications scheduled", { 
        oneHourBefore: oneHourBefore.toISOString(),
        threeHoursBefore: threeHoursBefore.toISOString() 
      });
    }

    return new Response(JSON.stringify({
      success: true,
      ...bookingResult,
      notifications_sent: true
    }), {
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("❌ BOOKING ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
