
-- Phase 1: Drop the notification system schema completely

-- Drop the send_notification_safe function
DROP FUNCTION IF EXISTS public.send_notification_safe(TEXT, JSONB);

-- Drop the notification_errors table (this will automatically drop associated policies and indexes)
DROP TABLE IF EXISTS public.notification_errors;
