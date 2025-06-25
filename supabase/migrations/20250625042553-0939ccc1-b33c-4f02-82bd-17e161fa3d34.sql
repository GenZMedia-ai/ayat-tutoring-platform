
-- Add Telegram fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
ADD COLUMN IF NOT EXISTS telegram_user_id TEXT,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS telegram_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMP WITH TIME ZONE;

-- Create telegram_verification_codes table
CREATE TABLE IF NOT EXISTS public.telegram_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_telegram_codes_user_id ON public.telegram_verification_codes (user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_codes_code ON public.telegram_verification_codes (code);
CREATE INDEX IF NOT EXISTS idx_telegram_codes_expires ON public.telegram_verification_codes (expires_at);

-- Enable RLS on the new table
ALTER TABLE public.telegram_verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for telegram verification codes
CREATE POLICY "Users can manage their own telegram codes" ON public.telegram_verification_codes
    FOR ALL USING (auth.uid() = user_id);

-- Function to generate telegram verification code
CREATE OR REPLACE FUNCTION public.generate_telegram_verification_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    v_code TEXT;
    v_code_exists BOOLEAN;
BEGIN
    -- Check if user exists and is approved
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = p_user_id AND status = 'approved'
    ) THEN
        RAISE EXCEPTION 'User not found or not approved';
    END IF;
    
    -- Generate unique code
    LOOP
        v_code := 'TF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        
        SELECT EXISTS(
            SELECT 1 FROM public.telegram_verification_codes 
            WHERE code = v_code AND expires_at > NOW()
        ) INTO v_code_exists;
        
        EXIT WHEN NOT v_code_exists;
    END LOOP;
    
    -- Invalidate any existing codes for this user
    UPDATE public.telegram_verification_codes 
    SET used = true 
    WHERE user_id = p_user_id AND expires_at > NOW();
    
    -- Insert new code
    INSERT INTO public.telegram_verification_codes (
        user_id, 
        code, 
        expires_at
    ) VALUES (
        p_user_id, 
        v_code, 
        NOW() + INTERVAL '5 minutes'
    );
    
    RETURN v_code;
END;
$function$;

-- Function to complete telegram setup
CREATE OR REPLACE FUNCTION public.complete_telegram_setup(
    p_token TEXT,
    p_telegram_id TEXT,
    p_chat_id BIGINT DEFAULT NULL,
    p_username TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    v_user_id UUID;
    v_user_name TEXT;
    v_code_record RECORD;
BEGIN
    -- Find and validate the verification code
    SELECT user_id, expires_at, used INTO v_code_record
    FROM public.telegram_verification_codes
    WHERE code = p_token;
    
    -- Check if code exists
    IF v_code_record.user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid verification code'
        );
    END IF;
    
    -- Check if code is expired
    IF v_code_record.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Verification code has expired'
        );
    END IF;
    
    -- Check if code is already used
    IF v_code_record.used THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Verification code has already been used'
        );
    END IF;
    
    v_user_id := v_code_record.user_id;
    
    -- Get user name
    SELECT full_name INTO v_user_name
    FROM public.profiles
    WHERE id = v_user_id;
    
    -- Update user profile with Telegram information
    UPDATE public.profiles 
    SET 
        telegram_chat_id = p_chat_id::TEXT,
        telegram_user_id = p_telegram_id,
        telegram_username = p_username,
        telegram_verified = true,
        telegram_linked_at = NOW(),
        updated_at = NOW()
    WHERE id = v_user_id;
    
    -- Mark code as used
    UPDATE public.telegram_verification_codes
    SET used = true
    WHERE code = p_token;
    
    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'user_name', v_user_name,
        'message', 'Telegram account linked successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Setup failed: ' || SQLERRM
        );
END;
$function$;

-- Function to check telegram verification status
CREATE OR REPLACE FUNCTION public.check_telegram_verification_status(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    v_profile RECORD;
BEGIN
    SELECT 
        telegram_verified,
        telegram_chat_id,
        telegram_username,
        telegram_linked_at
    INTO v_profile
    FROM public.profiles
    WHERE id = p_user_id;
    
    IF v_profile IS NULL THEN
        RETURN jsonb_build_object(
            'verified', false,
            'error', 'User not found'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'verified', COALESCE(v_profile.telegram_verified, false),
        'chat_id', v_profile.telegram_chat_id,
        'username', v_profile.telegram_username,
        'linked_at', v_profile.telegram_linked_at
    );
END;
$function$;
