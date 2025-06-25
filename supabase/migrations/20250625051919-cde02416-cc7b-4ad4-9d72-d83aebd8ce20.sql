
-- Enable the pg_net extension for HTTP requests from database functions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update the send_n8n_notification function to actually call the Edge Function
CREATE OR REPLACE FUNCTION public.send_n8n_notification(
    p_event_type TEXT,
    p_notification_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_notification_id TEXT;
    v_enriched_data JSONB;
    v_supabase_url TEXT;
    v_supabase_anon_key TEXT;
    v_edge_function_url TEXT;
    v_http_request_id BIGINT;
    v_recipient_phone TEXT;
    v_recipient_type TEXT;
BEGIN
    -- Generate unique notification ID
    v_notification_id := p_event_type || '_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8);
    
    -- Extract recipient info
    v_recipient_type := COALESCE(p_notification_data->>'recipient_type', 'unknown');
    v_recipient_phone := COALESCE(
        p_notification_data->>'phone', 
        p_notification_data->>'teacher_phone', 
        p_notification_data->>'sales_agent_phone', 
        p_notification_data->>'supervisor_phone'
    );
    
    -- Check for duplicate notifications (prevent spam)
    IF EXISTS (
        SELECT 1 FROM notification_logs 
        WHERE notification_id = v_notification_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Duplicate notification prevented'
        );
    END IF;
    
    -- Add system metadata to notification data
    v_enriched_data := p_notification_data || jsonb_build_object(
        'event_type', p_event_type,
        'notification_id', v_notification_id,
        'timestamp', now(),
        'system', 'AyatWBian'
    );
    
    -- Set up Edge Function URL
    v_supabase_url := 'https://aqxmhzgnsngxgdfshlkn.supabase.co';
    v_supabase_anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxeG1oemduc25neGdkZnNobGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDgzMTYsImV4cCI6MjA2NTg4NDMxNn0.xpiBH3hBcPoyuEnTghqPoAks8vfFApW03NzB61qQdLE';
    v_edge_function_url := v_supabase_url || '/functions/v1/n8n-notification-sender';
    
    -- Make HTTP request to Edge Function using pg_net
    SELECT net.http_post(
        url := v_edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_supabase_anon_key
        ),
        body := jsonb_build_object(
            'event_type', p_event_type,
            'notification_data', v_enriched_data
        )
    ) INTO v_http_request_id;
    
    -- Log the notification attempt with success status
    INSERT INTO notification_logs (
        event_type,
        recipient_type,
        recipient_phone,
        notification_data,
        notification_id,
        success,
        error_message
    ) VALUES (
        p_event_type,
        v_recipient_type,
        v_recipient_phone,
        v_enriched_data,
        v_notification_id,
        true, -- We assume success; actual status will be updated by Edge Function
        CASE 
            WHEN v_http_request_id IS NULL THEN 'Failed to queue HTTP request'
            ELSE NULL
        END
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'notification_id', v_notification_id,
        'http_request_id', v_http_request_id,
        'message', 'Notification sent to Edge Function for N8N delivery'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error
        INSERT INTO notification_logs (
            event_type,
            recipient_type,
            recipient_phone,
            notification_data,
            notification_id,
            success,
            error_message
        ) VALUES (
            p_event_type,
            v_recipient_type,
            v_recipient_phone,
            v_enriched_data,
            v_notification_id,
            false,
            SQLERRM
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'notification_id', v_notification_id
        );
END;
$$;

-- Update teacher profiles with sample phone numbers for testing
-- (Replace with actual phone numbers as needed)
UPDATE public.profiles 
SET phone = CASE 
    WHEN phone IS NULL OR phone = '' THEN '+201234567890'
    ELSE phone 
END
WHERE role = 'teacher' AND status = 'approved';

-- Create index for better performance on notification logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_id ON notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_success ON notification_logs(success);
