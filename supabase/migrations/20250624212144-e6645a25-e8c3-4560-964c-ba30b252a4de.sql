
-- Create notification settings table for configurable timings
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification logs table for tracking sent notifications
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  recipient_role TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  notification_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification queue table for scheduled notifications
CREATE TABLE public.notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  recipient_role TEXT,
  payload JSONB NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies for notification tables
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Policies for notification_settings (admin only)
CREATE POLICY "Admin can manage notification settings" 
  ON public.notification_settings 
  FOR ALL 
  USING (public.is_admin(auth.uid()));

-- Policies for notification_logs (admin and own role access)
CREATE POLICY "Users can view their own notification logs" 
  ON public.notification_logs 
  FOR SELECT 
  USING (
    public.is_admin(auth.uid()) OR 
    (recipient_role = public.get_user_role(auth.uid()))
  );

CREATE POLICY "System can insert notification logs" 
  ON public.notification_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Policies for notification_queue (admin only)
CREATE POLICY "Admin can manage notification queue" 
  ON public.notification_queue 
  FOR ALL 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "System can manage notification queue" 
  ON public.notification_queue 
  FOR ALL 
  WITH CHECK (true);

-- Insert default notification settings
INSERT INTO public.notification_settings (setting_key, setting_value, description) VALUES
('teacher_reminder_1h_enabled', 'true', 'Enable 1-hour teacher reminder notifications'),
('teacher_reminder_3h_enabled', 'true', 'Enable 3-hour teacher reminder notifications'),
('teacher_daily_sessions_time', '08:00', 'Time to send daily session lists (Egypt timezone)'),
('teacher_session_1h_enabled', 'true', 'Enable 1-hour pre-session alerts'),
('teacher_session_15m_enabled', 'true', 'Enable 15-minute pre-session alerts'),
('sales_followup_delay_minutes', '15', 'Minutes to wait before sending follow-up reminder'),
('sales_daily_followup_times', '08:00,17:00', 'Times to send daily follow-up summaries'),
('supervisor_unconfirmed_delay_hours', '1.5', 'Hours to wait before unconfirmed trial alert'),
('notification_retry_attempts', '3', 'Maximum retry attempts for failed notifications'),
('egypt_timezone', 'Africa/Cairo', 'System timezone for all notifications');

-- Create function to get notification setting
CREATE OR REPLACE FUNCTION public.get_notification_setting(p_setting_key TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT setting_value FROM public.notification_settings WHERE setting_key = p_setting_key;
$function$;

-- Create function to queue notification
CREATE OR REPLACE FUNCTION public.queue_notification(
  p_notification_type TEXT,
  p_recipient_phone TEXT,
  p_recipient_name TEXT,
  p_recipient_role TEXT,
  p_payload JSONB,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO public.notification_queue (
    notification_type,
    recipient_phone,
    recipient_name,
    recipient_role,
    payload,
    scheduled_for
  ) VALUES (
    p_notification_type,
    p_recipient_phone,
    p_recipient_name,
    p_recipient_role,
    p_payload,
    p_scheduled_for
  ) RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$function$;

-- Create function to log notification
CREATE OR REPLACE FUNCTION public.log_notification(
  p_notification_type TEXT,
  p_recipient_phone TEXT,
  p_recipient_name TEXT,
  p_recipient_role TEXT,
  p_payload JSONB,
  p_status TEXT DEFAULT 'sent',
  p_error_message TEXT DEFAULT NULL,
  p_notification_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.notification_logs (
    notification_type,
    recipient_phone,
    recipient_name,
    recipient_role,
    payload,
    status,
    sent_at,
    error_message,
    notification_id
  ) VALUES (
    p_notification_type,
    p_recipient_phone,
    p_recipient_name,
    p_recipient_role,
    p_payload,
    p_status,
    CASE WHEN p_status = 'sent' THEN now() ELSE NULL END,
    p_error_message,
    COALESCE(p_notification_id, gen_random_uuid()::text)
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$function$;
