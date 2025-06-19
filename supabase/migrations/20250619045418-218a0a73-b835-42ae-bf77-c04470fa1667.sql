
-- Create security definer functions to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_status(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT status FROM public.profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin' AND status = 'approved'
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage invitation codes" ON public.invitation_codes;
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
DROP POLICY IF EXISTS "Admins can manage currencies" ON public.currencies;

-- Create new safe RLS policies using security definer functions
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert new profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage invitation codes" ON public.invitation_codes
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage packages" ON public.packages
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage currencies" ON public.currencies
  FOR ALL USING (public.is_admin(auth.uid()));

-- Approve the existing admin user and create invitation code
-- Update the existing admin user to approved status
UPDATE public.profiles 
SET status = 'approved', approved_at = now(), approved_by = id
WHERE email = 'a@a.com' AND role = 'admin';

-- Insert admin invitation code (now that we have an admin user)
INSERT INTO public.invitation_codes (code, role, created_by, expires_at, usage_limit, is_active)
SELECT 'ADMIN2025', 'admin', id, NOW() + INTERVAL '30 days', 5, true
FROM public.profiles 
WHERE email = 'a@a.com' AND role = 'admin'
ON CONFLICT (code) DO NOTHING;
