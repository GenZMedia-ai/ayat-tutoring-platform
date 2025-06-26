
-- Fix teacher availability for today's date
-- Remove the restriction that prevents teachers from modifying today's availability
-- Keep protection only for already-booked slots

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS validate_availability_date_trigger ON public.teacher_availability;
DROP FUNCTION IF EXISTS public.validate_availability_date();

-- Create new validation function that allows today's modifications for teachers
CREATE OR REPLACE FUNCTION public.validate_teacher_availability_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only prevent modification of booked slots
  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') AND OLD.is_booked = true THEN
    RAISE EXCEPTION 'Cannot modify booked time slots to prevent disruption of confirmed bookings.';
  END IF;
  
  -- Allow all other operations (including today's availability modifications)
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create new trigger with updated validation
CREATE TRIGGER validate_teacher_availability_modification_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.teacher_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_teacher_availability_modification();

-- Update the RLS policies to remove today's date restrictions
DROP POLICY IF EXISTS "Cannot create availability for today" ON public.teacher_availability;
DROP POLICY IF EXISTS "Cannot update availability for today" ON public.teacher_availability;
DROP POLICY IF EXISTS "Cannot delete availability for today" ON public.teacher_availability;

-- Create new RLS policies that only protect booked slots
CREATE POLICY "Cannot modify booked availability" 
  ON public.teacher_availability 
  FOR UPDATE 
  USING (is_booked = false);

CREATE POLICY "Cannot delete booked availability" 
  ON public.teacher_availability 
  FOR DELETE 
  USING (is_booked = false);
