
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TELEGRAM-NOTIFICATIONS] ${step}${detailsStr}`);
};

const getEgyptTime = () => {
  return new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" });
};

interface NotificationPayload {
  notification_type: string;
  recipient_phone: string;
  recipient_name: string;
  recipient_role: string;
  data: any;
  system_name: string;
  notification_id: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

serve(async (req) => {
  try {
    logStep("🚀 TELEGRAM NOTIFICATION SERVICE STARTED", { timestamp: getEgyptTime() });

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

    const n8nWebhookUrl = Deno.env.get("N8N_TELEGRAM_NOTIFICATIONS_WEBHOOK");
    if (!n8nWebhookUrl) {
      logStep("❌ CRITICAL ERROR: N8N_TELEGRAM_NOTIFICATIONS_WEBHOOK not configured");
      throw new Error("N8N webhook URL not configured");
    }

    const payload: NotificationPayload = await req.json();
    logStep("📨 Notification received", { 
      type: payload.notification_type, 
      recipient: payload.recipient_name,
      role: payload.recipient_role 
    });

    // Validate required fields
    if (!payload.notification_type || !payload.recipient_phone || !payload.recipient_role) {
      throw new Error("Missing required notification fields");
    }

    // Generate notification ID if not provided
    if (!payload.notification_id) {
      payload.notification_id = crypto.randomUUID();
    }

    // Add system metadata
    payload.system_name = "AyatWBian";
    payload.timestamp = getEgyptTime();

    // Format notification data based on type
    const formattedNotification = await formatNotificationData(payload, supabaseClient);

    // Log notification attempt
    await supabaseClient.rpc('log_notification', {
      p_notification_type: payload.notification_type,
      p_recipient_phone: payload.recipient_phone,
      p_recipient_name: payload.recipient_name,
      p_recipient_role: payload.recipient_role,
      p_payload: formattedNotification,
      p_status: 'sending',
      p_notification_id: payload.notification_id
    });

    // Send to N8N webhook
    logStep("📤 Sending to N8N", { 
      webhook_type: "telegram_notification",
      notification_type: payload.notification_type 
    });

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedNotification)
    });

    if (response.ok) {
      logStep("✅ Notification sent successfully");
      
      // Update log status to sent
      await supabaseClient.rpc('log_notification', {
        p_notification_type: payload.notification_type,
        p_recipient_phone: payload.recipient_phone,
        p_recipient_name: payload.recipient_name,
        p_recipient_role: payload.recipient_role,
        p_payload: formattedNotification,
        p_status: 'sent',
        p_notification_id: payload.notification_id
      });

      return new Response(JSON.stringify({ 
        success: true, 
        notification_id: payload.notification_id,
        message: 'Notification sent successfully'
      }), {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 200,
      });
    } else {
      const errorText = await response.text();
      logStep("❌ Failed to send notification", { 
        status: response.status, 
        error: errorText 
      });

      // Update log status to failed
      await supabaseClient.rpc('log_notification', {
        p_notification_type: payload.notification_type,
        p_recipient_phone: payload.recipient_phone,
        p_recipient_name: payload.recipient_name,
        p_recipient_role: payload.recipient_role,
        p_payload: formattedNotification,
        p_status: 'failed',
        p_error_message: errorText,
        p_notification_id: payload.notification_id
      });

      throw new Error(`N8N webhook failed: ${response.status} - ${errorText}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("❌ NOTIFICATION ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function formatNotificationData(payload: NotificationPayload, supabaseClient: any) {
  const baseData = {
    notification_type: payload.notification_type,
    recipient_phone: payload.recipient_phone,
    recipient_name: payload.recipient_name,
    recipient_role: payload.recipient_role,
    system_name: payload.system_name,
    notification_id: payload.notification_id,
    timestamp: payload.timestamp,
    priority: payload.priority || 'medium',
    egypt_time: getEgyptTime()
  };

  // Add specific data based on notification type
  switch (payload.notification_type) {
    case 'teacher_new_assignment':
      return {
        ...baseData,
        student_name: payload.data.student_name,
        student_age: payload.data.student_age,
        trial_date: payload.data.trial_date,
        trial_time: payload.data.trial_time,
        platform: payload.data.platform,
        is_family: payload.data.is_family || false,
        student_count: payload.data.student_count || 1
      };

    case 'teacher_payment_confirmed':
      return {
        ...baseData,
        student_name: payload.data.student_name,
        payment_amount: payload.data.payment_amount,
        payment_currency: payload.data.payment_currency,
        session_count: payload.data.session_count,
        is_family: payload.data.is_family || false
      };

    case 'teacher_reminder_1h':
    case 'teacher_reminder_3h':
      return {
        ...baseData,
        student_name: payload.data.student_name,
        trial_date: payload.data.trial_date,
        trial_time: payload.data.trial_time,
        reminder_type: payload.notification_type.includes('1h') ? '1 hour' : '3 hours'
      };

    case 'teacher_daily_sessions':
      return {
        ...baseData,
        session_count: payload.data.sessions?.length || 0,
        sessions: payload.data.sessions || []
      };

    case 'teacher_session_1h':
    case 'teacher_session_15m':
      return {
        ...baseData,
        student_name: payload.data.student_name,
        session_date: payload.data.session_date,
        session_time: payload.data.session_time,
        session_number: payload.data.session_number,
        alert_type: payload.notification_type.includes('1h') ? '1 hour' : '15 minutes'
      };

    case 'sales_trial_completion':
      return {
        ...baseData,
        student_name: payload.data.student_name,
        trial_outcome: payload.data.trial_outcome,
        teacher_name: payload.data.teacher_name,
        trial_date: payload.data.trial_date
      };

    case 'sales_followup_reminder':
      return {
        ...baseData,
        student_name: payload.data.student_name,
        trial_outcome: payload.data.trial_outcome,
        minutes_since_trial: payload.data.minutes_since_trial || 15
      };

    case 'sales_payment_received':
      return {
        ...baseData,
        student_name: payload.data.student_name,
        payment_amount: payload.data.payment_amount,
        payment_currency: payload.data.payment_currency,
        teacher_name: payload.data.teacher_name
      };

    case 'sales_daily_followup':
      return {
        ...baseData,
        pending_followups: payload.data.pending_followups || 0,
        completed_trials: payload.data.completed_trials || 0,
        payments_received: payload.data.payments_received || 0
      };

    case 'supervisor_unconfirmed':
      return {
        ...baseData,
        student_name: payload.data.student_name,
        teacher_name: payload.data.teacher_name,
        trial_date: payload.data.trial_date,
        hours_since_trial: payload.data.hours_since_trial || 1.5
      };

    case 'supervisor_performance':
      return {
        ...baseData,
        teacher_name: payload.data.teacher_name,
        performance_issue: payload.data.performance_issue,
        metric_value: payload.data.metric_value
      };

    case 'supervisor_new_paid':
      return {
        ...baseData,
        student_name: payload.data.student_name,
        teacher_name: payload.data.teacher_name,
        payment_amount: payload.data.payment_amount,
        payment_currency: payload.data.payment_currency
      };

    case 'system_config':
      return {
        ...baseData,
        config_change: payload.data.config_change,
        old_value: payload.data.old_value,
        new_value: payload.data.new_value,
        changed_by: payload.data.changed_by
      };

    default:
      return {
        ...baseData,
        raw_data: payload.data
      };
  }
}
