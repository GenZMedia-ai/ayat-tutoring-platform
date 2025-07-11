-- PHASE 1: IMMEDIATE SECURITY FIXES
-- Critical security vulnerabilities that need immediate attention

-- 1. Fix audit_logs RLS (CRITICAL - currently allows any user to view audit logs)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create admin-only policy for audit_logs
CREATE POLICY "Admin users can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND status = 'approved'
  )
);

CREATE POLICY "Admin users can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND status = 'approved'
  )
);

-- 2. Fix search_path vulnerabilities in functions (CRITICAL SECURITY ISSUE)
-- Update all functions to use secure search_path

ALTER FUNCTION public.get_egypt_current_date() SET search_path = '';
ALTER FUNCTION public.validate_profile_data() SET search_path = '';
ALTER FUNCTION public.log_booking_operation(text, uuid, uuid, date, time, boolean, text) SET search_path = '';
ALTER FUNCTION public.generate_family_unique_id() SET search_path = '';
ALTER FUNCTION public.is_current_user_teacher() SET search_path = '';
ALTER FUNCTION public.validate_teacher_availability_date() SET search_path = '';
ALTER FUNCTION public.track_invitation_code_usage() SET search_path = '';
ALTER FUNCTION public.approve_user_with_audit(uuid) SET search_path = '';
ALTER FUNCTION public.confirm_trial(uuid) SET search_path = '';
ALTER FUNCTION public.reject_user_with_audit(uuid, text) SET search_path = '';
ALTER FUNCTION public.search_available_teachers(date, time, time, text[]) SET search_path = '';
ALTER FUNCTION public.generate_telegram_verification_code(uuid) SET search_path = '';
ALTER FUNCTION public.complete_telegram_setup(text, text, bigint, text) SET search_path = '';
ALTER FUNCTION public.check_telegram_verification_status(uuid) SET search_path = '';
ALTER FUNCTION public.get_notification_setting(text) SET search_path = '';
ALTER FUNCTION public.get_enriched_student_data(uuid) SET search_path = '';
ALTER FUNCTION public.send_n8n_notification(text, jsonb) SET search_path = '';
ALTER FUNCTION public.schedule_student_followup(uuid, uuid, timestamp with time zone, text, text) SET search_path = '';
ALTER FUNCTION public.simple_book_trial_session(jsonb, boolean, date, time, text, uuid) SET search_path = '';
ALTER FUNCTION public.complete_student_followup(uuid, text, text) SET search_path = '';
ALTER FUNCTION public.submit_trial_outcome(uuid, uuid, text, text, text, text) SET search_path = '';
ALTER FUNCTION public.log_whatsapp_contact(uuid, text, boolean, text) SET search_path = '';
ALTER FUNCTION public.get_teacher_paid_students(uuid) SET search_path = '';
ALTER FUNCTION public.complete_student_registration(uuid, jsonb) SET search_path = '';
ALTER FUNCTION public.complete_session_with_details(uuid, integer, text, boolean) SET search_path = '';
ALTER FUNCTION public.ensure_family_session_links() SET search_path = '';

-- 3. Move pg_net extension to prevent SSRF attacks (if it exists in public schema)
-- First check if pg_net exists in public schema, then move it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_net' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Create extensions schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS extensions;
    
    -- Move pg_net to extensions schema
    ALTER EXTENSION pg_net SET SCHEMA extensions;
    
    -- Grant necessary permissions
    GRANT USAGE ON SCHEMA extensions TO service_role;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO service_role;
  END IF;
END $$;

-- 4. Add missing foreign key constraints for data integrity
-- Add proper foreign key for audit_logs user_id
ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. Create index for audit_logs performance (used by frontend)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Log this critical security fix
INSERT INTO public.audit_logs (
  action_type, 
  target_type, 
  metadata
) VALUES (
  'security_patch_applied',
  'database',
  jsonb_build_object(
    'phase', 'phase_1_critical_security',
    'fixes', jsonb_build_array(
      'audit_logs_rls_enabled',
      'search_path_vulnerabilities_fixed',
      'pg_net_schema_secured',
      'foreign_keys_added'
    ),
    'timestamp', now()
  )
);