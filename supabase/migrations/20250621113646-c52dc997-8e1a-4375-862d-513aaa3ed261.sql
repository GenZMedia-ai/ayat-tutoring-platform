
-- Phase 1 & 2: Remove restrictive RLS policies and modify validation to be role-based

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Cannot create availability for today" ON public.teacher_availability;
DROP POLICY IF EXISTS "Cannot update availability for today" ON public.teacher_availability;
DROP POLICY IF EXISTS "Cannot delete availability for today" ON public.teacher_availability;

-- Drop the existing trigger that blocks everyone
DROP TRIGGER IF EXISTS validate_availability_date_trigger ON public.teacher_availability;

-- Create a new function to check if current user is a teacher
CREATE OR REPLACE FUNCTION public.is_current_user_teacher()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'teacher' 
    AND status = 'approved'
  );
$$;

-- Create a new validation function that only restricts teachers
CREATE OR REPLACE FUNCTION public.validate_teacher_availability_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only apply restrictions to teachers, not admins or system operations
  IF public.is_current_user_teacher() THEN
    -- Prevent teachers from modifying today's availability
    IF (COALESCE(NEW.date, OLD.date) = public.get_egypt_current_date()) THEN
      RAISE EXCEPTION 'Teachers cannot modify availability for today. Today''s schedule is locked to prevent disruption of confirmed bookings.';
    END IF;
  END IF;
  
  -- Allow all operations for non-teachers (admins, system operations, etc.)
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create new trigger that only applies to teacher operations
CREATE TRIGGER validate_teacher_availability_date_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.teacher_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_teacher_availability_date();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_current_user_teacher TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_teacher_availability_date TO authenticated;
