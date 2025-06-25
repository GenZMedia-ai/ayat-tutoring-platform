
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationData {
  event_type: string;
  [key: string]: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const n8nWebhookUrl = Deno.env.get('N8N_NOTIFICATION_WEBHOOK_URL')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current Egypt time
    const egyptTime = new Date().toLocaleString("en-US", {timeZone: "Africa/Cairo"});
    const currentEgyptTime = new Date(egyptTime);
    const currentHour = currentEgyptTime.getHours();
    const currentMinute = currentEgyptTime.getMinutes();

    console.log(`Scheduled notifications check at ${currentEgyptTime.toISOString()}`);

    const notifications: NotificationData[] = [];

    // 1. Check for confirmation reminders (1 hour and 3 hours after assignment)
    await checkConfirmationReminders(supabase, notifications);

    // 2. Check for pre-session alerts (1 hour and 15 minutes before sessions)
    await checkPreSessionAlerts(supabase, notifications);

    // 3. Check for daily session lists (8 AM Egypt time)
    if (currentHour === 8 && currentMinute < 15) {
      await generateDailySessionLists(supabase, notifications);
    }

    // 4. Check for follow-up reminders (15 minutes after trial completion)
    await checkFollowUpReminders(supabase, notifications);

    // 5. Check for supervisor alerts (1.5 hours after unconfirmed trials)
    await checkSupervisorAlerts(supabase, notifications);

    // 6. Check for daily follow-up summaries (8 AM and 5 PM Egypt time)
    if ((currentHour === 8 || currentHour === 17) && currentMinute < 15) {
      await generateDailyFollowUpSummaries(supabase, notifications);
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
          success,
          response: success ? 'sent' : await response.text()
        });

        // Log notification
        await supabase.from('notification_logs').insert({
          event_type: notification.event_type,
          recipient_type: notification.recipient_type || 'unknown',
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
        processed_at: currentEgyptTime.toISOString(),
        notifications_sent: notifications.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scheduled notifications error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkConfirmationReminders(supabase: any, notifications: NotificationData[]) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

  // 1 hour reminder
  const { data: oneHourStudents } = await supabase
    .from('students')
    .select(`
      id, name, created_at,
      profiles!assigned_teacher_id(full_name, phone)
    `)
    .eq('status', 'pending')
    .lt('created_at', oneHourAgo.toISOString())
    .gt('created_at', new Date(Date.now() - 90 * 60 * 1000).toISOString());

  for (const student of oneHourStudents || []) {
    if (student.profiles?.phone) {
      notifications.push({
        event_type: 'confirmation_reminder_1_hour',
        recipient_type: 'teacher',
        teacher_phone: student.profiles.phone,
        student_name: student.name,
        hours_elapsed: '1',
        trial_datetime: `${student.trial_date} ${student.trial_time}`
      });
    }
  }

  // 3 hour reminder
  const { data: threeHourStudents } = await supabase
    .from('students')
    .select(`
      id, name, created_at, trial_date, trial_time,
      profiles!assigned_teacher_id(full_name, phone)
    `)
    .eq('status', 'pending')
    .lt('created_at', threeHoursAgo.toISOString())
    .gt('created_at', new Date(Date.now() - 210 * 60 * 1000).toISOString());

  for (const student of threeHourStudents || []) {
    if (student.profiles?.phone) {
      notifications.push({
        event_type: 'confirmation_reminder_3_hours',
        recipient_type: 'teacher',
        teacher_phone: student.profiles.phone,
        student_name: student.name,
        hours_elapsed: '3',
        trial_datetime: `${student.trial_date} ${student.trial_time}`
      });
    }
  }
}

async function checkPreSessionAlerts(supabase: any, notifications: NotificationData[]) {
  const egyptTime = new Date().toLocaleString("en-US", {timeZone: "Africa/Cairo"});
  const currentEgyptTime = new Date(egyptTime);
  const oneHourLater = new Date(currentEgyptTime.getTime() + 60 * 60 * 1000);
  const fifteenMinutesLater = new Date(currentEgyptTime.getTime() + 15 * 60 * 1000);

  // 1 hour before session
  const { data: oneHourSessions } = await supabase
    .from('sessions')
    .select(`
      id, scheduled_date, scheduled_time, session_number,
      session_students(
        students(
          id, name,
          profiles!assigned_teacher_id(full_name, phone)
        )
      )
    `)
    .eq('status', 'scheduled')
    .eq('scheduled_date', oneHourLater.toISOString().split('T')[0]);

  for (const session of oneHourSessions || []) {
    const sessionDateTime = new Date(`${session.scheduled_date}T${session.scheduled_time}`);
    const timeDiff = Math.abs(sessionDateTime.getTime() - oneHourLater.getTime());
    
    if (timeDiff <= 5 * 60 * 1000) { // Within 5 minutes of 1 hour before
      for (const ss of session.session_students || []) {
        const student = ss.students;
        if (student?.profiles?.phone) {
          notifications.push({
            event_type: 'pre_session_alert_1_hour',
            recipient_type: 'teacher',
            teacher_phone: student.profiles.phone,
            student_name: student.name,
            session_time: session.scheduled_time,
            time_remaining: '1 hour',
            session_type: session.session_number === 1 ? 'Trial' : `Business English Session ${session.session_number}`
          });
        }
      }
    }
  }

  // 15 minutes before session
  const { data: fifteenMinuteSessions } = await supabase
    .from('sessions')
    .select(`
      id, scheduled_date, scheduled_time, session_number,
      session_students(
        students(
          id, name,
          profiles!assigned_teacher_id(full_name, phone)
        )
      )
    `)
    .eq('status', 'scheduled')
    .eq('scheduled_date', fifteenMinutesLater.toISOString().split('T')[0]);

  for (const session of fifteenMinuteSessions || []) {
    const sessionDateTime = new Date(`${session.scheduled_date}T${session.scheduled_time}`);
    const timeDiff = Math.abs(sessionDateTime.getTime() - fifteenMinutesLater.getTime());
    
    if (timeDiff <= 2 * 60 * 1000) { // Within 2 minutes of 15 minutes before
      for (const ss of session.session_students || []) {
        const student = ss.students;
        if (student?.profiles?.phone) {
          notifications.push({
            event_type: 'pre_session_alert_15_minutes',
            recipient_type: 'teacher',
            teacher_phone: student.profiles.phone,
            student_name: student.name,
            session_time: session.scheduled_time,
            time_remaining: '15 minutes',
            session_type: session.session_number === 1 ? 'Trial' : `Business English Session ${session.session_number}`
          });
        }
      }
    }
  }
}

async function generateDailySessionLists(supabase: any, notifications: NotificationData[]) {
  const egyptTime = new Date().toLocaleString("en-US", {timeZone: "Africa/Cairo"});
  const today = new Date(egyptTime).toISOString().split('T')[0];

  const { data: teacherSessions } = await supabase
    .from('profiles')
    .select(`
      id, full_name, phone,
      students!assigned_teacher_id(
        sessions(
          id, scheduled_date, scheduled_time, session_number,
          session_students(
            students(name)
          )
        )
      )
    `)
    .eq('role', 'teacher')
    .eq('status', 'approved')
    .not('phone', 'is', null);

  for (const teacher of teacherSessions || []) {
    const todaySessions = teacher.students
      ?.flatMap((s: any) => s.sessions || [])
      ?.filter((session: any) => session.scheduled_date === today)
      ?.map((session: any) => ({
        student_name: session.session_students?.[0]?.students?.name || 'Unknown',
        session_time: session.scheduled_time,
        session_type: session.session_number === 1 ? 'Trial' : 'Paid Session',
        session_number: session.session_number > 1 ? `${session.session_number}/16` : null
      }));

    if (todaySessions?.length > 0) {
      notifications.push({
        event_type: 'daily_session_list',
        recipient_type: 'teacher',
        teacher_phone: teacher.phone,
        teacher_name: teacher.full_name,
        sessions_array: todaySessions
      });
    }
  }
}

async function checkFollowUpReminders(supabase: any, notifications: NotificationData[]) {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const { data: completedTrials } = await supabase
    .from('sessions')
    .select(`
      id, trial_outcome_submitted_at,
      session_students(
        students(
          id, name,
          profiles!assigned_sales_agent_id(full_name, phone)
        )
      )
    `)
    .in('trial_outcome', ['completed', 'ghosted'])
    .not('trial_outcome_submitted_at', 'is', null)
    .gt('trial_outcome_submitted_at', fifteenMinutesAgo.toISOString())
    .lt('trial_outcome_submitted_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

  for (const session of completedTrials || []) {
    for (const ss of session.session_students || []) {
      const student = ss.students;
      if (student?.profiles?.phone) {
        notifications.push({
          event_type: 'follow_up_reminder_15_minutes',
          recipient_type: 'sales',
          sales_agent_phone: student.profiles.phone,
          student_name: student.name,
          time_elapsed: '15 minutes',
          follow_up_stage: 'Initial Contact'
        });
      }
    }
  }
}

async function checkSupervisorAlerts(supabase: any, notifications: NotificationData[]) {
  const oneAndHalfHoursAgo = new Date(Date.now() - 90 * 60 * 1000);

  const { data: unconfirmedStudents } = await supabase
    .from('students')
    .select(`
      id, name, created_at,
      profiles!assigned_teacher_id(full_name, phone),
      profiles!assigned_supervisor_id(full_name, phone)
    `)
    .eq('status', 'pending')
    .lt('created_at', oneAndHalfHoursAgo.toISOString());

  for (const student of unconfirmedStudents || []) {
    if (student.profiles?.phone) { // supervisor phone
      notifications.push({
        event_type: 'unconfirmed_trial_alert_1_5_hours',
        recipient_type: 'supervisor',
        supervisor_phone: student.profiles.phone,
        teacher_name: student.profiles?.full_name || 'Unknown',
        student_name: student.name,
        hours_elapsed: '1.5'
      });
    }
  }
}

async function generateDailyFollowUpSummaries(supabase: any, notifications: NotificationData[]) {
  const { data: salesAgents } = await supabase
    .from('profiles')
    .select(`
      id, full_name, phone,
      students!assigned_sales_agent_id(
        id, name, status, updated_at
      )
    `)
    .eq('role', 'sales')
    .eq('status', 'approved')
    .not('phone', 'is', null);

  for (const agent of salesAgents || []) {
    const followUps = agent.students
      ?.filter((s: any) => s.status === 'trial-completed')
      ?.map((s: any) => ({
        student_name: s.name,
        follow_up_stage: 'Payment Follow-up',
        last_contact: Math.floor((Date.now() - new Date(s.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
        scheduled_time: null
      }));

    if (followUps?.length > 0) {
      notifications.push({
        event_type: 'daily_follow_up_summary',
        recipient_type: 'sales',
        sales_agent_phone: agent.phone,
        sales_agent_name: agent.full_name,
        follow_ups_array: followUps
      });
    }
  }
}
