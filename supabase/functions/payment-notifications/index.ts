
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const n8nWebhookUrl = Deno.env.get('N8N_NOTIFICATION_WEBHOOK_URL')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { student_ids, payment_data } = await req.json();

    if (!student_ids || !payment_data) {
      return new Response(
        JSON.stringify({ error: 'Missing student_ids or payment_data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notifications = [];

    // Get student and assignment details
    const { data: students } = await supabase
      .from('students')
      .select(`
        id, name, package_name, package_session_count,
        profiles!assigned_teacher_id(full_name, phone),
        profiles!assigned_sales_agent_id(full_name, phone),
        profiles!assigned_supervisor_id(full_name, phone)
      `)
      .in('id', student_ids);

    for (const student of students || []) {
      // Send notification to teacher about payment confirmation
      if (student.profiles?.phone) {
        notifications.push({
          event_type: 'payment_confirmation',
          recipient_type: 'teacher',
          teacher_phone: student.profiles.phone,
          student_name: student.name,
          session_count: student.package_session_count || 8,
          package_name: student.package_name || 'Business English Package'
        });
      }

      // Send notification to sales agent about payment received
      if (student.profiles?.phone) {
        notifications.push({
          event_type: 'payment_received_notification',
          recipient_type: 'sales',
          sales_agent_phone: student.profiles.phone,
          student_name: student.name,
          package_name: student.package_name || 'Business English Package',
          session_count: student.package_session_count || 8
        });
      }

      // Send notification to supervisor about new paid student
      if (student.profiles?.phone) {
        notifications.push({
          event_type: 'new_paid_student_alert',
          recipient_type: 'supervisor',
          supervisor_phone: student.profiles.phone,
          student_name: student.name,
          teacher_name: student.profiles?.full_name || 'Unknown',
          package_name: student.package_name || 'Business English Package'
        });
      }
    }

    // Send all notifications to N8N
    const results = [];
    for (const notification of notifications) {
      try {
        const response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notification)
        });

        const success = response.ok;
        results.push({
          event_type: notification.event_type,
          recipient: notification.teacher_phone || notification.sales_agent_phone || notification.supervisor_phone,
          success
        });

        // Log notification
        await supabase.from('notification_logs').insert({
          event_type: notification.event_type,
          recipient_type: notification.recipient_type,
          recipient_phone: notification.teacher_phone || notification.sales_agent_phone || notification.supervisor_phone,
          notification_data: notification,
          success,
          error_message: success ? null : await response.text(),
          notification_id: `${notification.event_type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

      } catch (error) {
        console.error(`Failed to send notification ${notification.event_type}:`, error);
        results.push({
          event_type: notification.event_type,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: notifications.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment notification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
