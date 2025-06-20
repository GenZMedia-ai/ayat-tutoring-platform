
-- Create an edge function to get server date in Egypt timezone
-- First, let's add database-level protection for today's availability modifications

-- Create a function to get current date in Egypt timezone
CREATE OR REPLACE FUNCTION public.get_egypt_current_date()
RETURNS DATE
LANGUAGE sql
STABLE
AS $$
  SELECT (NOW() AT TIME ZONE 'Africa/Cairo')::DATE;
$$;

-- Create RLS policy to prevent modifications to today's availability
-- First, let's add the policy to prevent INSERT operations for today
CREATE POLICY "Cannot create availability for today" 
  ON public.teacher_availability 
  FOR INSERT 
  WITH CHECK (date != public.get_egypt_current_date());

-- Add policy to prevent UPDATE operations for today
CREATE POLICY "Cannot update availability for today" 
  ON public.teacher_availability 
  FOR UPDATE 
  USING (date != public.get_egypt_current_date());

-- Add policy to prevent DELETE operations for today
CREATE POLICY "Cannot delete availability for today" 
  ON public.teacher_availability 
  FOR DELETE 
  USING (date != public.get_egypt_current_date());

-- Create a function to validate availability modifications
CREATE OR REPLACE FUNCTION public.validate_availability_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Prevent any modifications to today's availability
  IF (COALESCE(NEW.date, OLD.date) = public.get_egypt_current_date()) THEN
    RAISE EXCEPTION 'Cannot modify availability for today. Today''s schedule is locked to prevent disruption of confirmed bookings.';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers to enforce the validation
DROP TRIGGER IF EXISTS validate_availability_date_trigger ON public.teacher_availability;
CREATE TRIGGER validate_availability_date_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.teacher_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_availability_date();
