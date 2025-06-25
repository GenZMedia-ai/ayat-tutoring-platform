
-- Create enhanced notification data enrichment functions
CREATE OR REPLACE FUNCTION public.get_complete_user_profile(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'email', p.email,
        'phone', p.phone,
        'role', p.role,
        'teacher_type', p.teacher_type,
        'status', p.status,
        'telegram_chat_id', p.telegram_chat_id,
        'telegram_user_id', p.telegram_user_id,
        'telegram_username', p.telegram_username,
        'telegram_verified', COALESCE(p.telegram_verified, false),
        'telegram_linked_at', p.telegram_linked_at,
        'language', p.language,
        'created_at', p.created_at,
        'updated_at', p.updated_at
    ) INTO v_profile
    FROM profiles p
    WHERE p.id = p_user_id;
    
    IF v_profile IS NULL THEN
        RETURN jsonb_build_object(
            'id', p_user_id,
            'error', 'User profile not found'
        );
    END IF;
    
    RETURN v_profile;
END;
$$;

-- Enhanced student data enrichment with complete relationship mapping
CREATE OR REPLACE FUNCTION public.get_enriched_student_data_v2(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_student_data JSONB;
    v_teacher_profile JSONB;
    v_sales_profile JSONB;
    v_supervisor_profile JSONB;
    v_family_data JSONB;
    v_payment_data JSONB;
    v_session_data JSONB;
BEGIN
    -- Get basic student data
    SELECT jsonb_build_object(
        'id', s.id,
        'unique_id', s.unique_id,
        'name', s.name,
        'age', s.age,
        'phone', s.phone,
        'country', s.country,
        'platform', s.platform,
        'trial_date', s.trial_date,
        'trial_time', s.trial_time,
        'status', s.status,
        'teacher_type', s.teacher_type,
        'parent_name', s.parent_name,
        'family_group_id', s.family_group_id,
        'package_session_count', s.package_session_count,
        'payment_amount', s.payment_amount,
        'payment_currency', s.payment_currency,
        'notes', s.notes,
        'created_at', s.created_at,
        'updated_at', s.updated_at
    ) INTO v_student_data
    FROM students s
    WHERE s.id = p_student_id;
    
    -- Get complete teacher profile
    SELECT public.get_complete_user_profile(s.assigned_teacher_id) INTO v_teacher_profile
    FROM students s
    WHERE s.id = p_student_id AND s.assigned_teacher_id IS NOT NULL;
    
    -- Get complete sales agent profile
    SELECT public.get_complete_user_profile(s.assigned_sales_agent_id) INTO v_sales_profile
    FROM students s
    WHERE s.id = p_student_id AND s.assigned_sales_agent_id IS NOT NULL;
    
    -- Get complete supervisor profile
    SELECT public.get_complete_user_profile(s.assigned_supervisor_id) INTO v_supervisor_profile
    FROM students s
    WHERE s.id = p_student_id AND s.assigned_supervisor_id IS NOT NULL;
    
    -- Get family group data if applicable
    SELECT jsonb_build_object(
        'id', fg.id,
        'unique_id', fg.unique_id,
        'parent_name', fg.parent_name,
        'student_count', fg.student_count,
        'status', fg.status,
        'created_at', fg.created_at
    ) INTO v_family_data
    FROM students s
    LEFT JOIN family_groups fg ON s.family_group_id = fg.id
    WHERE s.id = p_student_id AND s.family_group_id IS NOT NULL;
    
    -- Get latest payment data
    SELECT jsonb_build_object(
        'id', pl.id,
        'amount', pl.amount,
        'currency', pl.currency,
        'status', pl.status,
        'package_session_count', pl.package_session_count,
        'stripe_session_id', pl.stripe_session_id,
        'created_at', pl.created_at,
        'paid_at', pl.paid_at
    ) INTO v_payment_data
    FROM payment_links pl
    WHERE p_student_id = ANY(pl.student_ids)
    ORDER BY pl.created_at DESC
    LIMIT 1;
    
    -- Get latest session data
    SELECT jsonb_build_object(
        'id', s.id,
        'session_number', s.session_number,
        'scheduled_date', s.scheduled_date,
        'scheduled_time', s.scheduled_time,
        'status', s.status,
        'trial_outcome', s.trial_outcome,
        'actual_minutes', s.actual_minutes,
        'notes', s.notes,
        'created_at', s.created_at
    ) INTO v_session_data
    FROM sessions s
    JOIN session_students ss ON s.id = ss.session_id
    WHERE ss.student_id = p_student_id
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    -- Build comprehensive enriched data
    RETURN jsonb_build_object(
        'student', v_student_data,
        'teacher_profile', v_teacher_profile,
        'sales_agent_profile', v_sales_profile,
        'supervisor_profile', v_supervisor_profile,
        'family_data', v_family_data,
        'payment_data', v_payment_data,
        'latest_session', v_session_data,
        'enriched_at', NOW(),
        'system_version', 'v2.0'
    );
END;
$$;

-- Enhanced notification data preparation
CREATE OR REPLACE FUNCTION public.prepare_notification_payload(
    p_event_type TEXT,
    p_recipient_user_id UUID,
    p_student_id UUID DEFAULT NULL,
    p_additional_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_recipient_profile JSONB;
    v_enriched_student_data JSONB;
    v_communication_channels JSONB;
    v_context_data JSONB;
    v_final_payload JSONB;
BEGIN
    -- Get complete recipient profile
    v_recipient_profile := public.get_complete_user_profile(p_recipient_user_id);
    
    -- Get enriched student data if student_id provided
    IF p_student_id IS NOT NULL THEN
        v_enriched_student_data := public.get_enriched_student_data_v2(p_student_id);
    END IF;
    
    -- Determine available communication channels
    v_communication_channels := jsonb_build_object(
        'has_phone', (v_recipient_profile->>'phone') IS NOT NULL AND (v_recipient_profile->>'phone') != '',
        'has_telegram', COALESCE((v_recipient_profile->>'telegram_verified')::boolean, false),
        'telegram_chat_id', v_recipient_profile->>'telegram_chat_id',
        'telegram_username', v_recipient_profile->>'telegram_username',
        'preferred_channel', CASE 
            WHEN COALESCE((v_recipient_profile->>'telegram_verified')::boolean, false) THEN 'telegram'
            WHEN (v_recipient_profile->>'phone') IS NOT NULL THEN 'whatsapp'
            ELSE 'email'
        END
    );
    
    -- Build context data based on event type
    v_context_data := jsonb_build_object(
        'event_type', p_event_type,
        'timestamp', NOW(),
        'timezone', 'Africa/Cairo',
        'system_name', 'AyatWBian',
        'environment', 'production',
        'notification_version', '2.0'
    );
    
    -- Build final comprehensive payload
    v_final_payload := jsonb_build_object(
        'event_type', p_event_type,
        'recipient', v_recipient_profile,
        'communication_channels', v_communication_channels,
        'context', v_context_data
    );
    
    -- Add enriched student data if available
    IF v_enriched_student_data IS NOT NULL THEN
        v_final_payload := v_final_payload || jsonb_build_object('student_data', v_enriched_student_data);
    END IF;
    
    -- Add any additional custom data
    IF p_additional_data IS NOT NULL AND p_additional_data != '{}'::jsonb THEN
        v_final_payload := v_final_payload || jsonb_build_object('additional_data', p_additional_data);
    END IF;
    
    RETURN v_final_payload;
END;
$$;

-- Update the main notification sender function to use enriched data
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
    v_enriched_payload JSONB;
    v_supabase_url TEXT;
    v_supabase_anon_key TEXT;
    v_edge_function_url TEXT;
    v_http_request_id BIGINT;
    v_recipient_phone TEXT;
    v_recipient_type TEXT;
    v_recipient_user_id UUID;
    v_student_id UUID;
BEGIN
    -- Generate unique notification ID
    v_notification_id := p_event_type || '_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8);
    
    -- Extract recipient information from legacy data
    v_recipient_type := COALESCE(p_notification_data->>'recipient_type', 'unknown');
    v_recipient_phone := COALESCE(
        p_notification_data->>'phone', 
        p_notification_data->>'teacher_phone', 
        p_notification_data->>'sales_agent_phone', 
        p_notification_data->>'supervisor_phone'
    );
    
    -- Try to find recipient user ID based on phone and type
    IF v_recipient_type = 'teacher' THEN
        SELECT id INTO v_recipient_user_id 
        FROM profiles 
        WHERE phone = v_recipient_phone AND role = 'teacher' AND status = 'approved'
        LIMIT 1;
    ELSIF v_recipient_type = 'sales' THEN
        SELECT id INTO v_recipient_user_id 
        FROM profiles 
        WHERE phone = v_recipient_phone AND role = 'sales' AND status = 'approved'
        LIMIT 1;
    ELSIF v_recipient_type = 'supervisor' THEN
        SELECT id INTO v_recipient_user_id 
        FROM profiles 
        WHERE phone = v_recipient_phone AND role = 'supervisor' AND status = 'approved'
        LIMIT 1;
    END IF;
    
    -- Try to extract student ID from legacy data
    IF p_notification_data ? 'student_id' THEN
        v_student_id := (p_notification_data->>'student_id')::UUID;
    ELSIF p_notification_data ? 'student_name' THEN
        -- Try to find student by name (fallback)
        SELECT id INTO v_student_id 
        FROM students 
        WHERE name = p_notification_data->>'student_name'
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;
    
    -- Create enriched payload if we have recipient user ID
    IF v_recipient_user_id IS NOT NULL THEN
        v_enriched_payload := public.prepare_notification_payload(
            p_event_type,
            v_recipient_user_id,
            v_student_id,
            p_notification_data || jsonb_build_object('notification_id', v_notification_id)
        );
    ELSE
        -- Fallback to legacy format with basic enrichment
        v_enriched_payload := p_notification_data || jsonb_build_object(
            'event_type', p_event_type,
            'notification_id', v_notification_id,
            'timestamp', now(),
            'system', 'AyatWBian',
            'notification_version', '2.0',
            'recipient_lookup_failed', true
        );
    END IF;
    
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
            'notification_data', v_enriched_payload
        )
    ) INTO v_http_request_id;
    
    -- Log the notification attempt with enhanced data
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
        v_enriched_payload,
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
        'enriched_data_available', v_recipient_user_id IS NOT NULL,
        'message', 'Enhanced notification sent to Edge Function for N8N delivery'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error with enhanced context
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
            COALESCE(v_enriched_payload, p_notification_data),
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone_role ON profiles(phone, role) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_verified ON profiles(telegram_verified) WHERE telegram_verified = true;
CREATE INDEX IF NOT EXISTS idx_students_name_created_at ON students(name, created_at);
