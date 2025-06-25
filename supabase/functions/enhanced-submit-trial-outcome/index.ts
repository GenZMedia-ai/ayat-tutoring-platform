
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ENHANCED-TRIAL-OUTCOME] ${step}${detailsStr}`);
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
    logStep("🎯 ENHANCED TRIAL OUTCOME SERVICE STARTED");

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

    const { 
      studentId, 
      sessionId, 
      outcome, 
      teacherNotes, 
      studentBehavior, 
      recommendedPackage 
    } = await req.json();

    logStep("📝 Trial outcome submission", { 
      studentId, 
      sessionId, 
      outcome 
    });

    // Submit trial outcome using existing function
    const result = await supabaseClient.rpc('submit_trial_outcome', {
      p_student_id: studentId,
      p_session_id: sessionId,
      p_outcome: outcome,
      p_teacher_notes: teacherNotes,
      p_student_behavior: studentBehavior,
      p_recommended_package: recommendedPackage
    });

    if (result.error) {
      throw result.error;
    }

    const outcomeResult = result.data;
    logStep("✅ Trial outcome submitted", { 
      outcomeId: outcomeResult.outcome_id,
      isFamily: outcomeResult.is_family_trial 
    });

    // Get student and teacher details for notifications
    const { data: studentData } = await supabaseClient
      .from('students')
      .select(`
        name, 
        assigned_sales_agent_id,
        assigned_teacher_id,
        trial_date,
        profiles!assigned_sales_agent_id(full_name, phone),
        teacher_profiles:profiles!assigned_teacher_id(full_name, phone)
      `)
      .eq('id', studentId)
      .single();

    if (studentData) {
      // Send notification to sales agent about trial completion
      const salesAgent = studentData.profiles;
      if (salesAgent && salesAgent.phone) {
        const salesNotificationPayload = {
          notification_type: 'sales_trial_completion',
          recipient_phone: salesAgent.phone,
          recipient_name: salesAgent.full_name,
          recipient_role: 'sales',
          data: {
            student_name: studentData.name,
            trial_outcome: outcome,
            teacher_name: studentData.teacher_profiles?.full_name || 'Unknown',
            trial_date: studentData.trial_date
          },
          priority: 'high'
        };

        sendTelegramNotification(salesNotificationPayload);

        // Schedule follow-up reminder (15 minutes later if trial completed)
        if (outcome === 'completed') {
          const followupTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes later
          
          await supabaseClient.rpc('queue_notification', {
            p_notification_type: 'sales_followup_reminder',
            p_recipient_phone: salesAgent.phone,
            p_recipient_name: salesAgent.full_name,
            p_recipient_role: 'sales',
            p_payload: {
              student_name: studentData.name,
              trial_outcome: outcome,
              minutes_since_trial: 15
            },
            p_scheduled_for: followupTime.toISOString()
          });

          logStep("📅 Follow-up reminder scheduled", { 
            followupTime: followupTime.toISOString() 
          });
        }
      }

      // Send supervisor notification for unconfirmed trials (1.5 hours later)
      if (outcome === 'completed') {
        const supervisorTime = new Date(Date.now() + 1.5 * 60 * 60 * 1000); // 1.5 hours later
        
        // Get supervisor details (you may need to adjust this query based on your supervisor assignment logic)
        const { data: supervisorData } = await supabaseClient
          .from('profiles')
          .select('full_name, phone')
          .eq('role', 'supervisor')
          .eq('status', 'approved')
          .limit(1)
          .single();

        if (supervisorData && supervisorData.phone) {
          await supabaseClient.rpc('queue_notification', {
            p_notification_type: 'supervisor_unconfirmed',
            p_recipient_phone: supervisorData.phone,
            p_recipient_name: supervisorData.full_name,
            p_recipient_role: 'supervisor',
            p_payload: {
              student_name: studentData.name,
              teacher_name: studentData.teacher_profiles?.full_name || 'Unknown',
              trial_date: studentData.trial_date,
              hours_since_trial: 1.5
            },
            p_scheduled_for: supervisorTime.toISOString()
          });

          logStep("📅 Supervisor notification scheduled", { 
            supervisorTime: supervisorTime.toISOString() 
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      ...outcomeResult,
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
    logStep("❌ TRIAL OUTCOME ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
