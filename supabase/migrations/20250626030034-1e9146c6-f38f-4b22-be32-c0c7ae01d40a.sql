
-- Add audit_logs table for tracking administrative actions
CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type text NOT NULL,
    target_type text NOT NULL,
    target_id uuid,
    old_values jsonb,
    new_values jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX idx_audit_logs_target_type ON public.audit_logs(target_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Function to log audit actions
CREATE OR REPLACE FUNCTION public.log_audit_action(
    p_action_type text,
    p_target_type text,
    p_target_id uuid DEFAULT NULL,
    p_old_values jsonb DEFAULT NULL,
    p_new_values jsonb DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_audit_id uuid;
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action_type,
        target_type,
        target_id,
        old_values,
        new_values,
        metadata
    ) VALUES (
        auth.uid(),
        p_action_type,
        p_target_type,
        p_target_id,
        p_old_values,
        p_new_values,
        p_metadata
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;

-- Enhanced trigger for invitation code usage tracking
CREATE OR REPLACE FUNCTION public.track_invitation_code_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_code_record RECORD;
BEGIN
    -- Check if this profile was created with an invitation code
    IF NEW.id IS NOT NULL AND TG_OP = 'INSERT' THEN
        -- Try to find the invitation code that was used
        -- This assumes the code is somehow available during user creation
        -- We'll need to enhance this based on how the code is passed
        
        -- For now, we'll create a separate function to handle this
        -- that can be called explicitly when a user registers
        NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function to explicitly track invitation code usage
CREATE OR REPLACE FUNCTION public.record_invitation_code_usage(
    p_code text,
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_code_record RECORD;
    v_audit_id uuid;
BEGIN
    -- Get the invitation code record
    SELECT * INTO v_code_record
    FROM public.invitation_codes
    WHERE code = p_code AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invitation code not found or inactive'
        );
    END IF;
    
    -- Update the usage count
    UPDATE public.invitation_codes
    SET used_count = COALESCE(used_count, 0) + 1,
        updated_at = now()
    WHERE id = v_code_record.id;
    
    -- Log the audit action
    SELECT public.log_audit_action(
        'invitation_code_used',
        'invitation_codes',
        v_code_record.id,
        jsonb_build_object('used_count', v_code_record.used_count),
        jsonb_build_object('used_count', COALESCE(v_code_record.used_count, 0) + 1),
        jsonb_build_object('user_id', p_user_id, 'code', p_code)
    ) INTO v_audit_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'audit_id', v_audit_id,
        'new_usage_count', COALESCE(v_code_record.used_count, 0) + 1
    );
END;
$$;

-- Enhanced profile approval function with audit logging
CREATE OR REPLACE FUNCTION public.approve_user_with_audit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_profile RECORD;
    v_new_profile RECORD;
    v_audit_id uuid;
    v_current_user_id uuid;
BEGIN
    v_current_user_id := auth.uid();
    
    -- Get current profile state
    SELECT * INTO v_old_profile
    FROM public.profiles
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Update user status
    UPDATE public.profiles
    SET 
        status = 'approved',
        approved_by = v_current_user_id,
        approved_at = now(),
        updated_at = now()
    WHERE id = p_user_id;
    
    -- Get updated profile state
    SELECT * INTO v_new_profile
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Log audit action
    SELECT public.log_audit_action(
        'user_approved',
        'profiles',
        p_user_id,
        row_to_json(v_old_profile)::jsonb,
        row_to_json(v_new_profile)::jsonb,
        jsonb_build_object('approved_by', v_current_user_id)
    ) INTO v_audit_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'audit_id', v_audit_id,
        'user_id', p_user_id
    );
END;
$$;

-- Enhanced profile rejection function with audit logging
CREATE OR REPLACE FUNCTION public.reject_user_with_audit(p_user_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_profile RECORD;
    v_new_profile RECORD;
    v_audit_id uuid;
    v_current_user_id uuid;
BEGIN
    v_current_user_id := auth.uid();
    
    -- Get current profile state
    SELECT * INTO v_old_profile
    FROM public.profiles
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Update user status
    UPDATE public.profiles
    SET 
        status = 'rejected',
        updated_at = now()
    WHERE id = p_user_id;
    
    -- Get updated profile state
    SELECT * INTO v_new_profile
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Log audit action
    SELECT public.log_audit_action(
        'user_rejected',
        'profiles',
        p_user_id,
        row_to_json(v_old_profile)::jsonb,
        row_to_json(v_new_profile)::jsonb,
        jsonb_build_object('rejected_by', v_current_user_id, 'reason', p_reason)
    ) INTO v_audit_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'audit_id', v_audit_id,
        'user_id', p_user_id
    );
END;
$$;

-- Enable realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invitation_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;

-- Set replica identity for better realtime updates
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.invitation_codes REPLICA IDENTITY FULL;
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
