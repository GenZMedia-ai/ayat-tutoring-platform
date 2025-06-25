
-- Phase 1: Drop RLS policies first
DROP POLICY IF EXISTS "Admin can manage notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can view their own notification logs" ON public.notification_logs;
DROP POLICY IF EXISTS "System can insert notification logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Admin can manage notification queue" ON public.notification_queue;
DROP POLICY IF EXISTS "System can manage notification queue" ON public.notification_queue;

-- Phase 2: Drop database functions
DROP FUNCTION IF EXISTS public.get_notification_setting(TEXT);
DROP FUNCTION IF EXISTS public.queue_notification(TEXT, TEXT, TEXT, TEXT, JSONB, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS public.log_notification(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT);

-- Phase 3: Drop tables (CASCADE to handle any dependencies)
DROP TABLE IF EXISTS public.notification_queue CASCADE;
DROP TABLE IF EXISTS public.notification_logs CASCADE;
DROP TABLE IF EXISTS public.notification_settings CASCADE;
