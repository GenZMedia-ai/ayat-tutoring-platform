
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[N8N-WEBHOOK-HANDLER] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("N8N webhook received");

    // CORS headers for web requests
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

    const webhookData = await req.json();
    logStep("Webhook data received", webhookData);

    // Validate required fields
    const { 
      event_type, 
      student_unique_id, 
      stripe_session_id, 
      processing_status,
      sessions_created,
      teacher_assignment,
      notifications_sent,
      next_steps 
    } = webhookData;

    if (!event_type || !student_unique_id || !stripe_session_id || !processing_status) {
      throw new Error("Missing required fields in webhook data");
    }

    logStep("Processing payment completion", { 
      student_unique_id, 
      stripe_session_id, 
      processing_status 
    });

    // Step 1: Find the student(s) by unique_id
    const { data: students, error: studentError } = await supabaseClient
      .from('students')
      .select('id, name, family_group_id')
      .eq('unique_id', student_unique_id);

    if (studentError) {
      throw new Error(`Error finding student: ${studentError.message}`);
    }

    if (!students || students.length === 0) {
      // Try family groups if no individual student found
      const { data: familyGroups, error: familyError } = await supabaseClient
        .from('family_groups')
        .select('id, parent_name, student_count')
        .eq('unique_id', student_unique_id);

      if (familyError || !familyGroups || familyGroups.length === 0) {
        throw new Error(`No student or family found with unique_id: ${student_unique_id}`);
      }

      logStep("Found family group", { familyId: familyGroups[0].id });
    } else {
      logStep("Found student(s)", { count: students.length, studentIds: students.map(s => s.id) });
    }

    // Step 2: Update teacher assignment if provided
    if (teacher_assignment && teacher_assignment.teacher_id) {
      logStep("Updating teacher assignment", teacher_assignment);

      const studentIds = students ? students.map(s => s.id) : [];
      
      if (studentIds.length > 0) {
        const { error: teacherUpdateError } = await supabaseClient
          .from('students')
          .update({ 
            assigned_teacher_id: teacher_assignment.teacher_id,
            updated_at: new Date().toISOString()
          })
          .in('id', studentIds);

        if (teacherUpdateError) {
          logStep("Error updating teacher assignment", { error: teacherUpdateError });
        } else {
          logStep("Teacher assignment updated successfully");
        }
      }

      // Also update family group if applicable
      if (!students || students.length === 0) {
        const { error: familyTeacherError } = await supabaseClient
          .from('family_groups')
          .update({ 
            assigned_teacher_id: teacher_assignment.teacher_id,
            updated_at: new Date().toISOString()
          })
          .eq('unique_id', student_unique_id);

        if (familyTeacherError) {
          logStep("Error updating family teacher assignment", { error: familyTeacherError });
        }
      }
    }

    // Step 3: Create session records if provided
    if (sessions_created && Array.isArray(sessions_created) && sessions_created.length > 0) {
      logStep("Creating session records", { sessionCount: sessions_created.length });

      for (const sessionData of sessions_created) {
        // Create session
        const { data: newSession, error: sessionError } = await supabaseClient
          .from('sessions')
          .insert({
            scheduled_date: sessionData.scheduled_date,
            scheduled_time: sessionData.scheduled_time,
            status: 'scheduled',
            session_number: sessionData.session_number || 1,
            notes: `Created via n8n processing. Calendar event: ${sessionData.calendar_event_id || 'N/A'}`
          })
          .select()
          .single();

        if (sessionError) {
          logStep("Error creating session", { error: sessionError, sessionData });
          continue;
        }

        // Link students to session
        if (students && students.length > 0) {
          for (const student of students) {
            const { error: linkError } = await supabaseClient
              .from('session_students')
              .insert({
                session_id: newSession.id,
                student_id: student.id
              });

            if (linkError) {
              logStep("Error linking student to session", { error: linkError, studentId: student.id });
            }
          }
        }

        logStep("Session created and linked", { sessionId: newSession.id });
      }
    }

    // Step 4: Update student status to 'active' if processing was successful
    if (processing_status === 'success') {
      logStep("Updating student status to active");

      if (students && students.length > 0) {
        const { error: statusUpdateError } = await supabaseClient
          .from('students')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .in('id', students.map(s => s.id));

        if (statusUpdateError) {
          logStep("Error updating student status", { error: statusUpdateError });
        } else {
          logStep("Student status updated to active");
        }
      }

      // Update family group status if applicable
      if (!students || students.length === 0) {
        const { error: familyStatusError } = await supabaseClient
          .from('family_groups')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('unique_id', student_unique_id);

        if (familyStatusError) {
          logStep("Error updating family status", { error: familyStatusError });
        }
      }
    }

    // Step 5: Update payment link with processing completion
    const { error: paymentLinkError } = await supabaseClient
      .from('payment_links')
      .update({
        status: processing_status === 'success' ? 'paid' : 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_session_id', stripe_session_id);

    if (paymentLinkError) {
      logStep("Error updating payment link", { error: paymentLinkError });
    } else {
      logStep("Payment link updated with processing status");
    }

    // Step 6: Log the notification status and next steps
    logStep("Processing completed", {
      notifications_sent,
      next_steps,
      processing_status
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Webhook processed successfully',
      student_unique_id,
      processing_status
    }), {
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
