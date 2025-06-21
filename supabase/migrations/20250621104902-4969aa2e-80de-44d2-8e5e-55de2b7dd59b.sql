
-- Enhanced Booking System Fix
-- Phase 1: Update the validation function to allow booking operations while preventing schedule changes

-- Drop the existing overly restrictive trigger
DROP TRIGGER IF EXISTS validate_availability_date_trigger ON public.teacher_availability;

-- Create enhanced validation function that allows booking but prevents schedule changes
CREATE OR REPLACE FUNCTION public.validate_availability_date_enhanced()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Get current Egypt date
  DECLARE
    egypt_today DATE := public.get_egypt_current_date();
  BEGIN
    
    -- For INSERT operations - prevent creating new availability for today
    IF TG_OP = 'INSERT' THEN
      IF NEW.date = egypt_today THEN
        RAISE EXCEPTION 'Cannot create new availability for today. Today''s schedule is locked to prevent disruption of confirmed bookings.';
      END IF;
      RETURN NEW;
    END IF;
    
    -- For DELETE operations - prevent deleting today's availability
    IF TG_OP = 'DELETE' THEN
      IF OLD.date = egypt_today THEN
        RAISE EXCEPTION 'Cannot delete availability for today. Today''s schedule is locked to prevent disruption of confirmed bookings.';
      END IF;
      RETURN OLD;
    END IF;
    
    -- For UPDATE operations - allow booking operations but prevent schedule changes
    IF TG_OP = 'UPDATE' THEN
      IF NEW.date = egypt_today OR OLD.date = egypt_today THEN
        
        -- Allow legitimate booking operations (changing is_booked from false to true)
        IF OLD.is_booked = false AND NEW.is_booked = true AND
           OLD.date = NEW.date AND
           OLD.time_slot = NEW.time_slot AND
           OLD.is_available = NEW.is_available AND
           OLD.teacher_id = NEW.teacher_id THEN
          -- This is a legitimate booking operation - allow it
          RETURN NEW;
        END IF;
        
        -- Allow unbooking operations (changing is_booked from true to false) for admin/system operations
        IF OLD.is_booked = true AND NEW.is_booked = false AND
           OLD.date = NEW.date AND
           OLD.time_slot = NEW.time_slot AND
           OLD.is_available = NEW.is_available AND
           OLD.teacher_id = NEW.teacher_id THEN
          -- This is an unbooking operation - allow it
          RETURN NEW;
        END IF;
        
        -- Allow updating student_id for booking assignments
        IF OLD.date = NEW.date AND
           OLD.time_slot = NEW.time_slot AND
           OLD.is_available = NEW.is_available AND
           OLD.teacher_id = NEW.teacher_id AND
           OLD.is_booked = NEW.is_booked THEN
          -- Only student_id is changing - allow it
          RETURN NEW;
        END IF;
        
        -- Block all other changes to today's availability
        RAISE EXCEPTION 'Cannot modify schedule details for today. Only booking status changes are allowed. Today''s schedule is locked to prevent disruption of confirmed bookings.';
      END IF;
      
      -- Allow all changes for future dates
      RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
  END;
END;
$$;

-- Create enhanced trigger
CREATE TRIGGER validate_availability_date_enhanced_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.teacher_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_availability_date_enhanced();

-- Phase 2: Update RLS policies to be more granular

-- Drop existing overly restrictive policies
DROP POLICY IF EXISTS "Cannot create availability for today" ON public.teacher_availability;
DROP POLICY IF EXISTS "Cannot update availability for today" ON public.teacher_availability;
DROP POLICY IF EXISTS "Cannot delete availability for today" ON public.teacher_availability;

-- Create enhanced RLS policies that allow booking operations
CREATE POLICY "Enhanced availability insert protection" 
  ON public.teacher_availability 
  FOR INSERT 
  WITH CHECK (
    date != public.get_egypt_current_date() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sales')
      AND status = 'approved'
    )
  );

CREATE POLICY "Enhanced availability update protection" 
  ON public.teacher_availability 
  FOR UPDATE 
  USING (
    -- Allow updates for future dates
    date != public.get_egypt_current_date() OR
    -- Allow booking operations for today by sales agents and admins
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sales')
      AND status = 'approved'
    )
  );

CREATE POLICY "Enhanced availability delete protection" 
  ON public.teacher_availability 
  FOR DELETE 
  USING (
    date != public.get_egypt_current_date() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND status = 'approved'
    )
  );

-- Phase 3: Add logging function for booking operations (optional but helpful for debugging)
CREATE OR REPLACE FUNCTION public.log_booking_operation(
  p_operation_type TEXT,
  p_availability_id UUID,
  p_teacher_id UUID,
  p_date DATE,
  p_time_slot TIME,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be used to log booking operations for debugging
  -- Implementation can be added if needed for audit trail
  NULL;
END;
$$;

-- Phase 4: Verify the enhanced booking function works with new policies
-- The simple_book_trial_session function should now work correctly with these changes
