
-- First, let's fix the existing trigger function to handle all the metadata properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone, 
    role, 
    teacher_type, 
    language, 
    status
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'teacher'),
    new.raw_user_meta_data->>'teacher_type',
    COALESCE(new.raw_user_meta_data->>'language', 'en'),
    'pending'
  );
  RETURN new;
END;
$$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add database constraints for data integrity
ALTER TABLE public.profiles 
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN full_name SET NOT NULL,
  ALTER COLUMN phone SET NOT NULL,
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN language SET NOT NULL,
  ALTER COLUMN status SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON public.profiles(role, status);

-- Add a function to validate profile data consistency
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ensure teacher_type is set for teachers
  IF NEW.role = 'teacher' AND NEW.teacher_type IS NULL THEN
    RAISE EXCEPTION 'Teacher type is required for teacher role';
  END IF;
  
  -- Ensure teacher_type is only set for teachers
  IF NEW.role != 'teacher' AND NEW.teacher_type IS NOT NULL THEN
    NEW.teacher_type := NULL;
  END IF;
  
  -- Validate email format
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add validation trigger
DROP TRIGGER IF EXISTS validate_profile_data_trigger ON public.profiles;
CREATE TRIGGER validate_profile_data_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.validate_profile_data();

-- Fix any existing NULL values that might cause issues
UPDATE public.profiles 
SET 
  full_name = COALESCE(full_name, ''),
  phone = COALESCE(phone, ''),
  language = COALESCE(language, 'en'),
  status = COALESCE(status, 'pending')
WHERE full_name IS NULL OR phone IS NULL OR language IS NULL OR status IS NULL;
