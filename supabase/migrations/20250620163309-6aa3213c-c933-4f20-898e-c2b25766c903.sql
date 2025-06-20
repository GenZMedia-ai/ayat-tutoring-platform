
-- Create a secure function for availability checking that bypasses RLS
CREATE OR REPLACE FUNCTION public.search_available_teachers(
    p_date date,
    p_start_time time,
    p_end_time time,
    p_teacher_types text[]
)
RETURNS TABLE (
    teacher_id uuid,
    teacher_name text,
    teacher_type text,
    time_slot time,
    availability_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS securely
SET search_path = public -- Security best practice
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.full_name,
        p.teacher_type,
        ta.time_slot,
        ta.id
    FROM teacher_availability ta
    JOIN profiles p ON ta.teacher_id = p.id
    WHERE ta.date = p_date
        AND ta.time_slot >= p_start_time
        AND ta.time_slot < p_end_time
        AND ta.is_available = true
        AND ta.is_booked = false
        AND p.status = 'approved'
        AND p.role = 'teacher'
        AND p.teacher_type = ANY(p_teacher_types);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_available_teachers TO authenticated;
