
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NOTIFICATION-SCHEDULER] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("⏰ NOTIFICATION SCHEDULER STARTED");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const now = new Date();
    const egyptTime = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
    
    logStep("🕐 Processing scheduled notifications", { 
      utc_time: now.toISOString(),
      egypt_time: egyptTime.toISOString() 
    });

    // Get pending notifications that are due
    const { data: pendingNotifications, error } = await supabaseClient
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      throw error;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      logStep("✅ No pending notifications to process");
      return new Response(JSON.stringify({ 
        success: true, 
        processed: 0,
        message: 'No pending notifications' 
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep(`📬 Found ${pendingNotifications.length} pending notifications`);

    let processed = 0;
    let failed = 0;

    // Process each notification
    for (const notification of pendingNotifications) {
      try {
        // Mark as processing
        await supabaseClient
          .from('notification_queue')
          .update({ 
            status: 'processing',
            attempts: notification.attempts + 1 
          })
          .eq('id', notification.id);

        // Send notification via telegram-notifications function
        const notificationPayload = {
          notification_type: notification.notification_type,
          recipient_phone: notification.recipient_phone,
          recipient_name: notification.recipient_name,
          recipient_role: notification.recipient_role,
          data: notification.payload,
          notification_id: `scheduled_${notification.id}`,
          priority: 'medium'
        };

        const response = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-notifications`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
            },
            body: JSON.stringify(notificationPayload)
          }
        );

        if (response.ok) {
          // Mark as completed
          await supabaseClient
            .from('notification_queue')
            .update({ 
              status: 'completed',
              processed_at: now.toISOString()
            })
            .eq('id', notification.id);

          processed++;
          logStep("✅ Notification sent", { 
            id: notification.id, 
            type: notification.notification_type 
          });
        } else {
          throw new Error(`Failed to send notification: ${response.status}`);
        }

      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logStep("❌ Failed to process notification", { 
          id: notification.id, 
          error: errorMessage,
          attempts: notification.attempts + 1
        });

        // Check if max attempts reached
        const maxAttempts = parseInt(await getNotificationSetting(supabaseClient, 'notification_retry_attempts') || '3');
        
        if (notification.attempts + 1 >= maxAttempts) {
          await supabaseClient
            .from('notification_queue')
            .update({ 
              status: 'failed',
              processed_at: now.toISOString()
            })
            .eq('id', notification.id);
          
          logStep("💀 Notification failed permanently", { 
            id: notification.id, 
            attempts: notification.attempts + 1 
          });
        } else {
          // Retry later
          await supabaseClient
            .from('notification_queue')
            .update({ 
              status: 'pending',
              scheduled_for: new Date(now.getTime() + 300000).toISOString() // 5 minutes later
            })
            .eq('id', notification.id);
        }
      }
    }

    logStep("🎉 SCHEDULING COMPLETED", { 
      processed, 
      failed, 
      total: pendingNotifications.length 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      processed,
      failed,
      total: pendingNotifications.length
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("❌ SCHEDULER ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function getNotificationSetting(supabaseClient: any, settingKey: string): Promise<string | null> {
  const { data } = await supabaseClient.rpc('get_notification_setting', {
    p_setting_key: settingKey
  });
  return data;
}
