
-- Remove the old trigger and function that blocks all today's availability deletions
DROP TRIGGER IF EXISTS validate_availability_date_enhanced_trigger ON public.teacher_availability;
DROP FUNCTION IF EXISTS public.validate_availability_date_enhanced();

-- Also remove the original basic trigger and function if they still exist
DROP TRIGGER IF EXISTS validate_availability_date_trigger ON public.teacher_availability;
DROP FUNCTION IF EXISTS public.validate_availability_date();

-- Ensure our role-based trigger is the only one active
-- (It should already exist from the previous migration, but let's verify it's there)
-- The validate_teacher_availability_date_trigger should now be the only active trigger
