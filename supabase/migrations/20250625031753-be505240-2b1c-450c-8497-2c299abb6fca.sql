
-- Phase 1: Create simple notification error logging table
CREATE TABLE IF NOT EXISTS public.notification_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    error_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_notification_errors_created_at ON public.notification_errors (created_at DESC);

-- Enable RLS
ALTER TABLE public.notification_errors ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role can manage notification errors" ON public.notification_errors
    FOR ALL USING (auth.role() = 'service_role');

-- Create helper function to safely send notifications
CREATE OR REPLACE FUNCTION public.send_notification_safe(
    p_event_type TEXT,
    p_payload JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_webhook_url TEXT;
    v_webhook_secret TEXT;
    v_response RECORD;
BEGIN
    -- Get webhook configuration from vault
    SELECT decrypted_secret INTO v_webhook_url
    FROM vault.decrypted_secrets 
    WHERE name = 'N8N_WEBHOOK_URL';
    
    SELECT decrypted_secret INTO v_webhook_secret
    FROM vault.decrypted_secrets 
    WHERE name = 'N8N_WEBHOOK_SECRET';
    
    -- If no webhook configured, skip silently
    IF v_webhook_url IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Send notification
    BEGIN
        SELECT * INTO v_response FROM net.http_post(
            url := v_webhook_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'X-Webhook-Secret', COALESCE(v_webhook_secret, ''),
                'X-Event-Type', p_event_type
            ),
            body := jsonb_build_object(
                'eventType', p_event_type,
                'timestamp', NOW(),
                'payload', p_payload
            ),
            timeout_milliseconds := 5000
        );
        
        -- Check if successful
        IF v_response.status_code BETWEEN 200 AND 299 THEN
            RETURN TRUE;
        ELSE
            -- Log error but don't fail
            INSERT INTO public.notification_errors (event_type, payload, error_message)
            VALUES (p_event_type, p_payload, 'HTTP Error: ' || v_response.status_code::text);
            RETURN FALSE;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the main operation
        INSERT INTO public.notification_errors (event_type, payload, error_message)
        VALUES (p_event_type, p_payload, 'Exception: ' || SQLERRM);
        RETURN FALSE;
    END;
END;
$function$;
