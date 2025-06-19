
-- Add CHECK constraint for teacher_type validation
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_teacher_type 
CHECK (teacher_type IS NULL OR teacher_type IN ('kids', 'adult', 'mixed', 'expert'));

-- Update any existing invalid teacher type values to 'mixed' as a safe default
UPDATE public.profiles 
SET teacher_type = 'mixed' 
WHERE teacher_type IS NOT NULL 
AND teacher_type NOT IN ('kids', 'adult', 'mixed', 'expert');

-- Insert some test teacher availability data for debugging
-- First, let's create a test teacher if none exists
DO $$
DECLARE
    test_teacher_id UUID;
BEGIN
    -- Check if we have any approved teachers
    SELECT id INTO test_teacher_id 
    FROM public.profiles 
    WHERE role = 'teacher' AND status = 'approved' AND teacher_type = 'mixed'
    LIMIT 1;
    
    -- If no test teacher exists, we'll create availability for any existing teacher
    IF test_teacher_id IS NULL THEN
        SELECT id INTO test_teacher_id 
        FROM public.profiles 
        WHERE role = 'teacher'
        LIMIT 1;
        
        -- Update this teacher to be approved and mixed type
        IF test_teacher_id IS NOT NULL THEN
            UPDATE public.profiles 
            SET status = 'approved', teacher_type = 'mixed'
            WHERE id = test_teacher_id;
        END IF;
    END IF;
    
    -- Add availability slots for today and tomorrow if teacher exists
    IF test_teacher_id IS NOT NULL THEN
        INSERT INTO public.teacher_availability (teacher_id, date, time_slot, is_available, is_booked)
        VALUES 
            (test_teacher_id, CURRENT_DATE, '13:00:00', true, false),
            (test_teacher_id, CURRENT_DATE, '13:30:00', true, false),
            (test_teacher_id, CURRENT_DATE, '14:00:00', true, false),
            (test_teacher_id, CURRENT_DATE, '16:00:00', true, false),
            (test_teacher_id, CURRENT_DATE, '17:30:00', true, false),
            (test_teacher_id, CURRENT_DATE, '18:30:00', true, false),
            (test_teacher_id, CURRENT_DATE, '19:00:00', true, false),
            (test_teacher_id, CURRENT_DATE + 1, '14:00:00', true, false),
            (test_teacher_id, CURRENT_DATE + 1, '16:00:00', true, false),
            (test_teacher_id, CURRENT_DATE + 1, '19:00:00', true, false)
        ON CONFLICT (teacher_id, date, time_slot) DO NOTHING;
    END IF;
END $$;
