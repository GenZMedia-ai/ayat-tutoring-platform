import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationData {
  event_type: string;
  recipient_type: string;
  [key: string]: any;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function checkScheduledFollowUps(supabase: any, notifications: NotificationData[]) {
  console.log('🔍 Checking for scheduled follow-ups...');
  
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  try {
    // Get due follow-ups with atomic update for idempotency
    const { data: dueFollowUps, error } = await supabase
      .from('sales_followups')
      .select(`
        id, scheduled_date, reason, notes,
        students!inner(
          id, name, status, phone,
          profiles!assigned_sales_agent_id(full_name, phone)
        )
      `)
      .eq('completed', false)
      .eq('notification_sent', false)
      .lte('scheduled_date', now.toISOString())
      .gte('scheduled_date', fiveMinutesAgo.toISOString())
      .eq('students.status', 'follow-up');
      
    if (error) {
      console.error('❌ Error fetching scheduled follow-ups:', error);
      return;
    }
    
    console.log(`📋 Found ${dueFollowUps?.length || 0} due follow-ups`);
    
    // Process each follow-up with atomic updates to prevent duplicates
    for (const followUp of dueFollowUps || []) {
      console.log(`🔄 Processing follow-up ${followUp.id} for student ${followUp.students?.name}`);
      
      // Atomic update to prevent duplicate notifications
      const { data: updated, error: updateError } = await supabase
        .from('sales_followups')
        .update({ notification_sent: true })
        .eq('id', followUp.id)
        .eq('notification_sent', false)
        .select('id');
        
      if (updateError) {
        console.error(`❌ Error marking follow-up ${followUp.id} as notified:`, updateError);
        continue;
      }
      
      // Only send notification if we successfully marked it
      if (updated && updated.length > 0) {
        const student = followUp.students;
        const salesAgent = student?.profiles;
        
        if (salesAgent?.phone) {
          console.log(`✅ Queuing follow-up reminder for ${salesAgent.full_name}`);
          
          notifications.push({
            event_type: 'sales_follow_up_reminder',
            recipient_type: 'sales',
            sales_agent_phone: salesAgent.phone,
            sales_agent_name: salesAgent.full_name,
            student_name: student.name,
            student_phone: student.phone,
            follow_up_reason: followUp.reason,
            follow_up_notes: followUp.notes || '',
            scheduled_time: followUp.scheduled_date
          });
        }
      } else {
        console.log(`⚠️ Follow-up ${followUp.id} was already processed by another instance`);
      }
    }
    
    console.log(`🎯 Queued ${notifications.filter(n => n.event_type === 'sales_follow_up_reminder').length} follow-up reminder notifications`);
  } catch (error) {
    console.error('❌ Error in checkScheduledFollowUps:', error);
  }
}

async function checkTrialReminders(supabase: any, notifications: NotificationData[]) {
  console.log('🔍 Checking for trial reminders...');

  const now = new Date();
  const reminderTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  try {
    const { data: dueReminders, error } = await supabase
      .from('students')
      .select(`
        id, name, phone, trial_date, trial_time,
        assigned_sales_agent_id,
        profiles!assigned_sales_agent_id (
          full_name,
          phone
        )
      `)
      .eq('status', 'pending')
      .lte('trial_date', reminderTime.toISOString().split('T')[0])
      .gte('trial_date', now.toISOString().split('T')[0])
      .not('trial_time', 'is', null);

    if (error) {
      console.error('❌ Error fetching trial reminders:', error);
      return;
    }

    console.log(`📋 Found ${dueReminders?.length || 0} trial reminders`);

    for (const student of dueReminders || []) {
      if (!student.trial_time) {
        console.warn(`⚠️ No trial time set for student ${student.id}`);
        continue;
      }

      const trialDateTime = new Date(`${student.trial_date}T${student.trial_time}`);
      const timeDiff = trialDateTime.getTime() - now.getTime();

      if (timeDiff <= 2 * 60 * 60 * 1000 && timeDiff > 0) {
        const salesAgent = student.profiles;

        if (salesAgent?.phone) {
          console.log(`✅ Queuing trial reminder for ${salesAgent.full_name}`);

          notifications.push({
            event_type: 'trial_reminder',
            recipient_type: 'sales',
            sales_agent_phone: salesAgent.phone,
            sales_agent_name: salesAgent.full_name,
            student_name: student.name,
            student_phone: student.phone,
            trial_date: student.trial_date,
            trial_time: student.trial_time
          });
        }
      }
    }

    console.log(`🎯 Queued ${notifications.filter(n => n.event_type === 'trial_reminder').length} trial reminder notifications`);
  } catch (error) {
    console.error('❌ Error in checkTrialReminders:', error);
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔔 Scheduled notifications check started')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const notifications: NotificationData[] = []
    
    // Check for scheduled follow-ups
    await checkScheduledFollowUps(supabase, notifications)
    
    // Check for trial reminders
    await checkTrialReminders(supabase, notifications)
    
    // Send notifications if any were found
    if (notifications.length > 0) {
      console.log(`📤 Sending ${notifications.length} notifications to N8N`)
      
      // Send to N8N webhook
      const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
      if (n8nWebhookUrl) {
        try {
          const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              notifications,
              timestamp: new Date().toISOString(),
              source: 'supabase-scheduled-notifications'
            })
          })
          
          if (!response.ok) {
            throw new Error(`N8N webhook failed: ${response.status}`)
          }
          
          console.log('✅ Notifications sent to N8N successfully')
        } catch (error) {
          console.error('❌ Failed to send notifications to N8N:', error)
        }
      } else {
        console.log('⚠️ N8N_WEBHOOK_URL not configured')
      }
    } else {
      console.log('📭 No scheduled notifications found')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_sent: notifications.length,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Scheduled notifications error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
