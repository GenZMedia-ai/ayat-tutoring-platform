
-- Phase 1: Core Notification Infrastructure

-- Create notification settings table for configurable timing
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default notification timing settings
INSERT INTO public.notification_settings (setting_key, setting_value, description) VALUES
('morning_reminder_time', '8', 'Hour in 24h format for morning reminders (8 AM)'),
('evening_reminder_time', '17', 'Hour in 24h format for evening reminders (5 PM)'),
('confirmation_stage_1', '60', 'Minutes for first confirmation reminder (1 hour)'),
('confirmation_stage_2', '180', 'Minutes for second confirmation reminder (3 hours)'),
('confirmation_stage_3', '90', 'Minutes for supervisor alert (1.5 hours)'),
('session_reminder_1', '60', 'Minutes before session for first reminder (1 hour)'),
('session_reminder_2', '15', 'Minutes before session for second reminder (15 minutes)'),
('follow_up_reminder_delay', '15', 'Minutes after trial completion for follow-up reminder')
ON CONFLICT (setting_key) DO NOTHING;

-- Create notification log table for audit trail
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    recipient_type TEXT NOT NULL, -- 'teacher', 'sales', 'supervisor'
    recipient_phone TEXT,
    notification_data JSONB NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    notification_id TEXT UNIQUE -- for duplicate prevention
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification settings (admin only)
CREATE POLICY "Admins can manage notification settings" ON public.notification_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
        )
    );

-- RLS policies for notification logs (admins and related users can view)
CREATE POLICY "Users can view relevant notification logs" ON public.notification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (
                role = 'admin' 
                OR (role IN ('teacher', 'sales', 'supervisor') AND phone = recipient_phone)
            )
            AND status = 'approved'
        )
    );

-- Core notification function that sends to N8N
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
    v_n8n_webhook_url TEXT;
    v_notification_id TEXT;
    v_http_request_id BIGINT;
    v_enriched_data JSONB;
BEGIN
    -- Generate unique notification ID
    v_notification_id := p_event_type || '_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8);
    
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
    
    -- Get N8N webhook URL from secrets
    -- Note: This will be implemented via edge function for security
    
    -- Log the notification attempt
    INSERT INTO notification_logs (
        event_type,
        recipient_type,
        recipient_phone,
        notification_data,
        notification_id,
        success
    ) VALUES (
        p_event_type,
        COALESCE(p_notification_data->>'recipient_type', 'unknown'),
        COALESCE(p_notification_data->>'phone', p_notification_data->>'teacher_phone', p_notification_data->>'sales_agent_phone', p_notification_data->>'supervisor_phone'),
        v_enriched_data,
        v_notification_id,
        true
    );
    
    -- For now, return success - actual HTTP call will be handled by edge function
    RETURN jsonb_build_object(
        'success', true,
        'notification_id', v_notification_id,
        'message', 'Notification queued for N8N delivery'
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
            COALESCE(p_notification_data->>'recipient_type', 'unknown'),
            COALESCE(p_notification_data->>'phone', 'unknown'),
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

-- Helper function to get notification setting
CREATE OR REPLACE FUNCTION public.get_notification_setting(p_setting_key TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT setting_value 
    FROM public.notification_settings 
    WHERE setting_key = p_setting_key;
$$;

-- Function to enrich student data with teacher/sales/supervisor details
CREATE OR REPLACE FUNCTION public.get_enriched_student_data(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'student_id', s.id,
        'student_name', s.name,
        'student_age', s.age,
        'platform', s.platform,
        'trial_date', s.trial_date,
        'trial_time', s.trial_time,
        'status', s.status,
        'teacher_name', pt.full_name,
        'teacher_phone', pt.phone,
        'sales_agent_name', ps.full_name,
        'sales_agent_phone', ps.phone,
        'supervisor_name', pv.full_name,
        'supervisor_phone', pv.phone,
        'family_group_id', s.family_group_id
    ) INTO v_student_data
    FROM students s
    LEFT JOIN profiles pt ON s.assigned_teacher_id = pt.id
    LEFT JOIN profiles ps ON s.assigned_sales_agent_id = ps.id
    LEFT JOIN profiles pv ON s.assigned_supervisor_id = pv.id
    WHERE s.id = p_student_id;
    
    RETURN v_student_data;
END;
$$;

-- Update existing functions to send notifications

-- 1. Modify book_family_trial_session to send "New Student Assignment" notification
CREATE OR REPLACE FUNCTION public.book_family_trial_session(
    p_booking_data jsonb,
    p_selected_date date,
    p_utc_start_time time,
    p_teacher_type text,
    p_teacher_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id uuid;
    v_user_role text;
    v_teacher_name text;
    v_teacher_phone text;
    v_session_id uuid;
    v_family_group_id uuid;
    v_family_unique_id text;
    v_student_record jsonb;
    v_student_names text := '';
    v_student_count integer := 0;
    v_student_id uuid;
    v_notification_result jsonb;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- Check authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Check authorization (sales agents only)
    SELECT role INTO v_user_role 
    FROM public.profiles 
    WHERE id = v_user_id AND status = 'approved';
    
    IF v_user_role IS NULL OR v_user_role NOT IN ('sales', 'admin') THEN
        RAISE EXCEPTION 'Access denied - sales agent role required';
    END IF;
    
    -- Get teacher details
    SELECT full_name, phone INTO v_teacher_name, v_teacher_phone
    FROM public.profiles
    WHERE id = p_teacher_id;
    
    IF v_teacher_name IS NULL THEN
        RAISE EXCEPTION 'Teacher not found';
    END IF;
    
    -- Verify slot is still available
    IF NOT EXISTS (
        SELECT 1 FROM public.teacher_availability
        WHERE teacher_id = p_teacher_id
        AND date = p_selected_date
        AND time_slot = p_utc_start_time
        AND is_available = true
        AND is_booked = false
    ) THEN
        RAISE EXCEPTION 'Time slot no longer available';
    END IF;
    
    -- Generate family unique ID
    v_family_unique_id := public.generate_family_unique_id();
    
    -- Create family group
    INSERT INTO public.family_groups (
        unique_id,
        parent_name,
        phone,
        country,
        platform,
        teacher_type,
        trial_date,
        trial_time,
        assigned_teacher_id,
        assigned_sales_agent_id,
        notes,
        status,
        student_count
    ) VALUES (
        v_family_unique_id,
        p_booking_data->>'parentName',
        p_booking_data->>'phone',
        p_booking_data->>'country',
        p_booking_data->>'platform',
        p_teacher_type,
        p_selected_date,
        p_utc_start_time,
        p_teacher_id,
        v_user_id,
        COALESCE(p_booking_data->>'notes', ''),
        'pending',
        jsonb_array_length(p_booking_data->'students')
    ) RETURNING id INTO v_family_group_id;
    
    -- Create session
    INSERT INTO public.sessions (
        scheduled_date,
        scheduled_time,
        status,
        notes
    ) VALUES (
        p_selected_date,
        p_utc_start_time,
        'scheduled',
        COALESCE(p_booking_data->>'notes', '')
    ) RETURNING id INTO v_session_id;
    
    -- Create individual student records linked to family
    FOR v_student_record IN 
        SELECT value FROM jsonb_array_elements(p_booking_data->'students')
    LOOP
        v_student_count := v_student_count + 1;
        
        INSERT INTO public.students (
            unique_id,
            name,
            age,
            phone,
            country,
            platform,
            teacher_type,
            trial_date,
            trial_time,
            assigned_teacher_id,
            assigned_sales_agent_id,
            parent_name,
            notes,
            status,
            family_group_id
        ) VALUES (
            v_family_unique_id || '_S' || v_student_count,
            v_student_record->>'name',
            (v_student_record->>'age')::integer,
            p_booking_data->>'phone',
            p_booking_data->>'country',
            p_booking_data->>'platform',
            p_teacher_type,
            p_selected_date,
            p_utc_start_time,
            p_teacher_id,
            v_user_id,
            p_booking_data->>'parentName',
            COALESCE(p_booking_data->>'notes', ''),
            'pending',
            v_family_group_id
        ) RETURNING id INTO v_student_id;
        
        -- Link EACH student to the session
        INSERT INTO public.session_students (session_id, student_id)
        VALUES (v_session_id, v_student_id);
        
        -- Build response strings
        IF v_student_names = '' THEN
            v_student_names := v_student_record->>'name';
        ELSE
            v_student_names := v_student_names || ', ' || (v_student_record->>'name');
        END IF;
    END LOOP;
    
    -- Mark slot as booked
    UPDATE public.teacher_availability 
    SET is_booked = true, updated_at = NOW()
    WHERE teacher_id = p_teacher_id 
    AND date = p_selected_date 
    AND time_slot = p_utc_start_time;
    
    -- Update teacher's last booked timestamp
    UPDATE public.profiles 
    SET last_booked_at = NOW() 
    WHERE id = p_teacher_id;
    
    -- NEW: Send notification to teacher about new family assignment
    SELECT public.send_n8n_notification(
        'new_student_assignment',
        jsonb_build_object(
            'recipient_type', 'teacher',
            'teacher_phone', v_teacher_phone,
            'student_name', v_student_names,
            'trial_date', p_selected_date::text,
            'trial_time', (p_utc_start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Cairo')::text,
            'student_age', 'Family Group',
            'platform', p_booking_data->>'platform',
            'status', 'Pending',
            'is_family_group', true,
            'student_count', v_student_count
        )
    ) INTO v_notification_result;
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'teacher_name', v_teacher_name,
        'teacher_id', p_teacher_id::text,
        'session_id', v_session_id::text,
        'family_group_id', v_family_group_id::text,
        'family_unique_id', v_family_unique_id,
        'student_names', v_student_names,
        'student_count', v_student_count,
        'students_linked_to_session', v_student_count,
        'booked_time_slot', p_utc_start_time::text,
        'notification_sent', v_notification_result
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Family booking failed: %', SQLERRM;
END;
$$;

-- 2. Modify simple_book_trial_session to send "New Student Assignment" notification
CREATE OR REPLACE FUNCTION public.simple_book_trial_session(
    p_booking_data jsonb,
    p_is_multi_student boolean,
    p_selected_date date,
    p_utc_start_time time,
    p_teacher_type text,
    p_teacher_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id uuid;
    v_user_role text;
    v_teacher_name text;
    v_teacher_phone text;
    v_session_id uuid;
    v_student_names text := '';
    v_student_record jsonb;
    v_unique_id text;
    v_first_student_id uuid;
    v_notification_result jsonb;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- Check authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Check authorization (sales agents only)
    SELECT role INTO v_user_role 
    FROM public.profiles 
    WHERE id = v_user_id AND status = 'approved';
    
    IF v_user_role IS NULL OR v_user_role NOT IN ('sales', 'admin') THEN
        RAISE EXCEPTION 'Access denied - sales agent role required';
    END IF;
    
    -- Get teacher details
    SELECT full_name, phone INTO v_teacher_name, v_teacher_phone
    FROM public.profiles
    WHERE id = p_teacher_id;
    
    IF v_teacher_name IS NULL THEN
        RAISE EXCEPTION 'Teacher not found';
    END IF;
    
    -- Verify slot is still available
    IF NOT EXISTS (
        SELECT 1 FROM public.teacher_availability
        WHERE teacher_id = p_teacher_id
        AND date = p_selected_date
        AND time_slot = p_utc_start_time
        AND is_available = true
        AND is_booked = false
    ) THEN
        RAISE EXCEPTION 'Time slot no longer available';
    END IF;
    
    -- Create session
    INSERT INTO public.sessions (
        scheduled_date,
        scheduled_time,
        status,
        notes
    ) VALUES (
        p_selected_date,
        p_utc_start_time,
        'scheduled',
        COALESCE(p_booking_data->>'notes', '')
    ) RETURNING id INTO v_session_id;
    
    -- Handle students
    IF p_is_multi_student THEN
        -- Multi-student booking
        FOR v_student_record IN 
            SELECT value FROM jsonb_array_elements(p_booking_data->'students')
        LOOP
            v_unique_id := public.generate_student_unique_id();
            
            INSERT INTO public.students (
                unique_id,
                name,
                age,
                phone,
                country,
                platform,
                teacher_type,
                trial_date,
                trial_time,
                assigned_teacher_id,
                assigned_sales_agent_id,
                parent_name,
                notes,
                status
            ) VALUES (
                v_unique_id,
                v_student_record->>'name',
                (v_student_record->>'age')::integer,
                p_booking_data->>'phone',
                p_booking_data->>'country',
                p_booking_data->>'platform',
                p_teacher_type,
                p_selected_date,
                p_utc_start_time,
                p_teacher_id,
                v_user_id,
                p_booking_data->>'parentName',
                COALESCE(p_booking_data->>'notes', ''),
                'pending'
            ) RETURNING id INTO v_first_student_id;
            
            -- Link to session
            INSERT INTO public.session_students (session_id, student_id)
            VALUES (v_session_id, v_first_student_id);
            
            -- Build response strings
            IF v_student_names = '' THEN
                v_student_names := v_student_record->>'name';
            ELSE
                v_student_names := v_student_names || ', ' || (v_student_record->>'name');
            END IF;
        END LOOP;
    ELSE
        -- Single student booking
        v_unique_id := public.generate_student_unique_id();
        
        INSERT INTO public.students (
            unique_id,
            name,
            age,
            phone,
            country,
            platform,
            teacher_type,
            trial_date,
            trial_time,
            assigned_teacher_id,
            assigned_sales_agent_id,
            notes,
            status
        ) VALUES (
            v_unique_id,
            p_booking_data->>'studentName',
            (p_booking_data->>'age')::integer,
            p_booking_data->>'phone',
            p_booking_data->>'country',
            p_booking_data->>'platform',
            p_teacher_type,
            p_selected_date,
            p_utc_start_time,
            p_teacher_id,
            v_user_id,
            COALESCE(p_booking_data->>'notes', ''),
            'pending'
        ) RETURNING id INTO v_first_student_id;
        
        -- Link to session
        INSERT INTO public.session_students (session_id, student_id)
        VALUES (v_session_id, v_first_student_id);
        
        v_student_names := p_booking_data->>'studentName';
    END IF;
    
    -- Mark slot as booked
    UPDATE public.teacher_availability 
    SET is_booked = true, updated_at = NOW()
    WHERE teacher_id = p_teacher_id 
    AND date = p_selected_date 
    AND time_slot = p_utc_start_time;
    
    -- NEW: Send notification to teacher about new assignment
    SELECT public.send_n8n_notification(
        'new_student_assignment',
        jsonb_build_object(
            'recipient_type', 'teacher',
            'teacher_phone', v_teacher_phone,
            'student_name', v_student_names,
            'trial_date', p_selected_date::text,
            'trial_time', (p_utc_start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Cairo')::text,
            'student_age', CASE 
                WHEN p_is_multi_student THEN 'Multiple Students'
                ELSE (p_booking_data->>'age')
            END,
            'platform', p_booking_data->>'platform',
            'status', 'Pending',
            'is_family_group', false
        )
    ) INTO v_notification_result;
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'teacher_name', v_teacher_name,
        'teacher_id', p_teacher_id::text,
        'session_id', v_session_id::text,
        'student_names', v_student_names,
        'booked_time_slot', p_utc_start_time::text,
        'notification_sent', v_notification_result
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Booking failed: %', SQLERRM;
END;
$$;

-- 3. Modify submit_trial_outcome to send notifications
CREATE OR REPLACE FUNCTION public.submit_trial_outcome(
    p_student_id uuid,
    p_session_id uuid,
    p_outcome text,
    p_teacher_notes text DEFAULT NULL,
    p_student_behavior text DEFAULT NULL,
    p_recommended_package text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
    v_outcome_id UUID;
    v_family_group_id UUID;
    v_session_exists BOOLEAN := FALSE;
    v_students_updated INTEGER := 0;
    v_family_students_count INTEGER := 0;
    v_student_data JSONB;
    v_teacher_name TEXT;
    v_notification_result JSONB;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- Check authentication and authorization
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    SELECT role INTO v_user_role 
    FROM public.profiles 
    WHERE id = v_user_id AND status = 'approved';
    
    IF v_user_role NOT IN ('teacher', 'admin') THEN
        RAISE EXCEPTION 'Only teachers can submit trial outcomes';
    END IF;
    
    -- Get teacher name for notification
    SELECT full_name INTO v_teacher_name
    FROM public.profiles
    WHERE id = v_user_id;
    
    -- Enhanced session validation
    SELECT EXISTS(
        SELECT 1 FROM sessions s
        JOIN session_students ss ON s.id = ss.session_id
        WHERE s.id = p_session_id AND ss.student_id = p_student_id
    ) INTO v_session_exists;
    
    IF NOT v_session_exists THEN
        PERFORM public.ensure_family_session_links();
        
        SELECT EXISTS(
            SELECT 1 FROM sessions s
            JOIN session_students ss ON s.id = ss.session_id
            WHERE s.id = p_session_id AND ss.student_id = p_student_id
        ) INTO v_session_exists;
        
        IF NOT v_session_exists THEN
            RAISE EXCEPTION 'Session not found or not linked to student';
        END IF;
    END IF;
    
    -- Get enriched student data for notification
    SELECT public.get_enriched_student_data(p_student_id) INTO v_student_data;
    
    -- Get family group ID if student belongs to a family
    SELECT family_group_id INTO v_family_group_id
    FROM public.students
    WHERE id = p_student_id;
    
    -- Insert trial outcome
    INSERT INTO public.trial_outcomes (
        student_id,
        session_id,
        outcome,
        teacher_notes,
        student_behavior,
        recommended_package,
        submitted_by
    ) VALUES (
        p_student_id,
        p_session_id,
        p_outcome,
        p_teacher_notes,
        p_student_behavior,
        p_recommended_package,
        v_user_id
    ) RETURNING id INTO v_outcome_id;
    
    -- Update student status based on outcome
    IF p_outcome = 'completed' THEN
        UPDATE public.students 
        SET status = 'trial-completed', updated_at = now()
        WHERE id = p_student_id;
        v_students_updated := 1;
    ELSIF p_outcome = 'ghosted' THEN
        UPDATE public.students 
        SET status = 'trial-ghosted', updated_at = now()
        WHERE id = p_student_id;
        v_students_updated := 1;
    END IF;
    
    -- Update family group and all family members if applicable
    IF v_family_group_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_family_students_count
        FROM public.students 
        WHERE family_group_id = v_family_group_id;
        
        IF p_outcome = 'completed' THEN
            UPDATE public.students 
            SET status = 'trial-completed', updated_at = now()
            WHERE family_group_id = v_family_group_id;
            
            UPDATE public.family_groups
            SET status = 'trial-completed', updated_at = now()
            WHERE id = v_family_group_id;
            
            v_students_updated := v_family_students_count;
            
        ELSIF p_outcome = 'ghosted' THEN
            UPDATE public.students 
            SET status = 'trial-ghosted', updated_at = now()
            WHERE family_group_id = v_family_group_id;
            
            UPDATE public.family_groups
            SET status = 'trial-ghosted', updated_at = now()
            WHERE id = v_family_group_id;
            
            v_students_updated := v_family_students_count;
        END IF;
    END IF;
    
    -- Update session with trial outcome
    UPDATE public.sessions 
    SET 
        trial_outcome = p_outcome,
        trial_outcome_notes = p_teacher_notes,
        trial_outcome_submitted_by = v_user_id,
        trial_outcome_submitted_at = now(),
        status = CASE 
            WHEN p_outcome = 'completed' THEN 'completed'
            WHEN p_outcome = 'ghosted' THEN 'cancelled'
            ELSE status
        END,
        updated_at = now()
    WHERE id = p_session_id;
    
    -- NEW: Send notification to sales agent about trial completion
    IF v_student_data->>'sales_agent_phone' IS NOT NULL THEN
        SELECT public.send_n8n_notification(
            'trial_completion_alert',
            jsonb_build_object(
                'recipient_type', 'sales',
                'sales_agent_phone', v_student_data->>'sales_agent_phone',
                'student_name', v_student_data->>'student_name',
                'trial_outcome', p_outcome,
                'teacher_name', v_teacher_name
            )
        ) INTO v_notification_result;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'outcome_id', v_outcome_id,
        'family_group_id', v_family_group_id,
        'students_updated', v_students_updated,
        'is_family_trial', v_family_group_id IS NOT NULL,
        'notification_sent', v_notification_result,
        'message', CASE 
            WHEN v_family_group_id IS NOT NULL THEN 
                'Family trial outcome submitted successfully for ' || v_students_updated || ' students'
            ELSE 
                'Trial outcome submitted successfully'
        END
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to submit trial outcome: %', SQLERRM;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_event_type ON notification_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient_phone ON notification_logs(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_settings_key ON notification_settings(setting_key);
