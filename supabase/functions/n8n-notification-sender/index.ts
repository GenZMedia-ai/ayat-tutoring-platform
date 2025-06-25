
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const n8nWebhookUrl = Deno.env.get('N8N_NOTIFICATION_WEBHOOK_URL')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'POST') {
      const { event_type, notification_data } = await req.json();

      if (!event_type || !notification_data) {
        return new Response(
          JSON.stringify({ error: 'Missing event_type or notification_data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send notification to N8N webhook
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type,
          timestamp: new Date().toISOString(),
          ...notification_data
        })
      });

      const success = n8nResponse.ok;
      const responseText = await n8nResponse.text();

      // Log the notification result
      await supabase.from('notification_logs').insert({
        event_type,
        recipient_type: notification_data.recipient_type || 'unknown',
        recipient_phone: notification_data.teacher_phone || notification_data.sales_agent_phone || notification_data.supervisor_phone,
        notification_data: {
          event_type,
          ...notification_data,
          n8n_response: success ? 'success' : responseText
        },
        success,
        error_message: success ? null : responseText,
        notification_id: `${event_type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

      return new Response(
        JSON.stringify({
          success,
          message: success ? 'Notification sent to N8N successfully' : 'Failed to send notification to N8N',
          n8n_response: responseText
        }),
        { 
          status: success ? 200 : 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('N8N notification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
