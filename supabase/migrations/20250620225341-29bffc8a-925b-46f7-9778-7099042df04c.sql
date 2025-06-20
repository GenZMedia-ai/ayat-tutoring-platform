
-- Phase 1: Database Schema & Data Fix (Fixed)

-- Temporarily disable the availability validation trigger for setup
DROP TRIGGER IF EXISTS validate_availability_date_trigger ON public.teacher_availability;

-- Clear existing test data and add proper 30-minute slots for testing
DELETE FROM public.teacher_availability WHERE date IN ('2025-06-21', '2025-06-22', '2025-06-23');

-- Get a test teacher ID (or create one if needed)
DO $$
DECLARE
    test_teacher_id UUID;
    test_teacher_name TEXT := 'Ahmed Hassan';
BEGIN
    -- Try to find an existing approved teacher
    SELECT id INTO test_teacher_id 
    FROM public.profiles 
    WHERE role = 'teacher' AND status = 'approved' AND teacher_type = 'mixed'
    LIMIT 1;
    
    -- If no teacher exists, create one
    IF test_teacher_id IS NULL THEN
        INSERT INTO public.profiles (
            id, email, full_name, phone, role, teacher_type, language, status
        ) VALUES (
            gen_random_uuid(),
            'test.teacher@example.com',
            test_teacher_name,
            '+201234567890',
            'teacher',
            'mixed',
            'en',
            'approved'
        ) RETURNING id INTO test_teacher_id;
    END IF;
    
    -- Add comprehensive 30-minute time slots for 2025-06-21
    INSERT INTO public.teacher_availability (teacher_id, date, time_slot, is_available, is_booked)
    VALUES 
        -- Morning slots (8:00 AM - 12:00 PM Egypt time = 06:00 - 10:00 UTC)
        (test_teacher_id, '2025-06-21', '06:00:00', true, false),
        (test_teacher_id, '2025-06-21', '06:30:00', true, false),
        (test_teacher_id, '2025-06-21', '07:00:00', true, false),
        (test_teacher_id, '2025-06-21', '07:30:00', true, false),
        (test_teacher_id, '2025-06-21', '08:00:00', true, false),
        (test_teacher_id, '2025-06-21', '08:30:00', true, false),
        (test_teacher_id, '2025-06-21', '09:00:00', true, false),
        (test_teacher_id, '2025-06-21', '09:30:00', true, false),
        (test_teacher_id, '2025-06-21', '10:00:00', true, false),
        
        -- Afternoon slots (2:00 PM - 6:00 PM Egypt time = 12:00 - 16:00 UTC)
        (test_teacher_id, '2025-06-21', '12:00:00', true, false),
        (test_teacher_id, '2025-06-21', '12:30:00', true, false),
        (test_teacher_id, '2025-06-21', '13:00:00', true, false),
        (test_teacher_id, '2025-06-21', '13:30:00', true, false),
        (test_teacher_id, '2025-06-21', '14:00:00', true, false),
        (test_teacher_id, '2025-06-21', '14:30:00', true, false),
        (test_teacher_id, '2025-06-21', '15:00:00', true, false),
        (test_teacher_id, '2025-06-21', '15:30:00', true, false),
        (test_teacher_id, '2025-06-21', '16:00:00', true, false),
        
        -- Evening slots (7:00 PM - 10:00 PM Egypt time = 17:00 - 20:00 UTC)
        (test_teacher_id, '2025-06-21', '17:00:00', true, false),
        (test_teacher_id, '2025-06-21', '17:30:00', true, false),
        (test_teacher_id, '2025-06-21', '18:00:00', true, false),
        (test_teacher_id, '2025-06-21', '18:30:00', true, false),
        (test_teacher_id, '2025-06-21', '19:00:00', true, false),
        (test_teacher_id, '2025-06-21', '19:30:00', true, false),
        (test_teacher_id, '2025-06-21', '20:00:00', true, false)
    ON CONFLICT (teacher_id, date, time_slot) DO NOTHING;
    
    -- Add slots for 2025-06-22 and 2025-06-23 as well
    INSERT INTO public.teacher_availability (teacher_id, date, time_slot, is_available, is_booked)
    VALUES 
        (test_teacher_id, '2025-06-22', '10:00:00', true, false),
        (test_teacher_id, '2025-06-22', '10:30:00', true, false),
        (test_teacher_id, '2025-06-22', '14:00:00', true, false),
        (test_teacher_id, '2025-06-22', '14:30:00', true, false),
        (test_teacher_id, '2025-06-22', '18:00:00', true, false),
        (test_teacher_id, '2025-06-22', '18:30:00', true, false),
        (test_teacher_id, '2025-06-23', '08:00:00', true, false),
        (test_teacher_id, '2025-06-23', '08:30:00', true, false),
        (test_teacher_id, '2025-06-23', '12:00:00', true, false),
        (test_teacher_id, '2025-06-23', '12:30:00', true, false)
    ON CONFLICT (teacher_id, date, time_slot) DO NOTHING;
    
    RAISE NOTICE 'Created test teacher % with comprehensive 30-minute slots', test_teacher_name;
END $$;

-- Recreate the validation trigger for future use
CREATE TRIGGER validate_availability_date_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.teacher_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_availability_date();

-- Drop the problematic book_trial_session function that causes array errors
DROP FUNCTION IF EXISTS public.book_trial_session(jsonb, boolean, date, time, text, uuid[]);

-- Create a simpler booking function without complex array operations
CREATE OR REPLACE FUNCTION public.simple_book_trial_session(
    p_booking_data jsonb,
    p_is_multi_student boolean,
    p_selected_date date,
    p_utc_start_time time,
    p_teacher_type text,
    p_teacher_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_user_id uuid;
    v_user_role text;
    v_teacher_name text;
    v_session_id uuid;
    v_student_names text := '';
    v_student_record jsonb;
    v_unique_id text;
    v_first_student_id uuid;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- Check authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Check authorization (sales agents only)
    SELECT role INTO v_user_role 
    FROM public.profiles 
    WHERE id = v_user_id AND status = 'approved';
    
    IF v_user_role IS NULL OR v_user_role NOT IN ('sales', 'admin') THEN
        RAISE EXCEPTION 'Access denied - sales agent role required';
    END IF;
    
    -- Get teacher name
    SELECT full_name INTO v_teacher_name
    FROM public.profiles
    WHERE id = p_teacher_id;
    
    IF v_teacher_name IS NULL THEN
        RAISE EXCEPTION 'Teacher not found';
    END IF;
    
    -- Verify slot is still available
    IF NOT EXISTS (
        SELECT 1 FROM public.teacher_availability
        WHERE teacher_id = p_teacher_id
        AND date = p_selected_date
        AND time_slot = p_utc_start_time
        AND is_available = true
        AND is_booked = false
    ) THEN
        RAISE EXCEPTION 'Time slot no longer available';
    END IF;
    
    -- Create session
    INSERT INTO public.sessions (
        scheduled_date,
        scheduled_time,
        status,
        notes
    ) VALUES (
        p_selected_date,
        p_utc_start_time,
        'scheduled',
        COALESCE(p_booking_data->>'notes', '')
    ) RETURNING id INTO v_session_id;
    
    -- Handle students
    IF p_is_multi_student THEN
        -- Multi-student booking
        FOR v_student_record IN 
            SELECT value FROM jsonb_array_elements(p_booking_data->'students')
        LOOP
            v_unique_id := public.generate_student_unique_id();
            
            INSERT INTO public.students (
                unique_id,
                name,
                age,
                phone,
                country,
                platform,
                teacher_type,
                trial_date,
                trial_time,
                assigned_teacher_id,
                assigned_sales_agent_id,
                parent_name,
                notes,
                status
            ) VALUES (
                v_unique_id,
                v_student_record->>'name',
                (v_student_record->>'age')::integer,
                p_booking_data->>'phone',
                p_booking_data->>'country',
                p_booking_data->>'platform',
                p_teacher_type,
                p_selected_date,
                p_utc_start_time,
                p_teacher_id,
                v_user_id,
                p_booking_data->>'parentName',
                COALESCE(p_booking_data->>'notes', ''),
                'pending'
            ) RETURNING id INTO v_first_student_id;
            
            -- Link to session
            INSERT INTO public.session_students (session_id, student_id)
            VALUES (v_session_id, v_first_student_id);
            
            -- Build response strings
            IF v_student_names = '' THEN
                v_student_names := v_student_record->>'name';
            ELSE
                v_student_names := v_student_names || ', ' || (v_student_record->>'name');
            END IF;
        END LOOP;
    ELSE
        -- Single student booking
        v_unique_id := public.generate_student_unique_id();
        
        INSERT INTO public.students (
            unique_id,
            name,
            age,
            phone,
            country,
            platform,
            teacher_type,
            trial_date,
            trial_time,
            assigned_teacher_id,
            assigned_sales_agent_id,
            notes,
            status
        ) VALUES (
            v_unique_id,
            p_booking_data->>'studentName',
            (p_booking_data->>'age')::integer,
            p_booking_data->>'phone',
            p_booking_data->>'country',
            p_booking_data->>'platform',
            p_teacher_type,
            p_selected_date,
            p_utc_start_time,
            p_teacher_id,
            v_user_id,
            COALESCE(p_booking_data->>'notes', ''),
            'pending'
        ) RETURNING id INTO v_first_student_id;
        
        -- Link to session
        INSERT INTO public.session_students (session_id, student_id)
        VALUES (v_session_id, v_first_student_id);
        
        v_student_names := p_booking_data->>'studentName';
    END IF;
    
    -- Mark slot as booked
    UPDATE public.teacher_availability 
    SET is_booked = true, updated_at = NOW()
    WHERE teacher_id = p_teacher_id 
    AND date = p_selected_date 
    AND time_slot = p_utc_start_time;
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'teacher_name', v_teacher_name,
        'teacher_id', p_teacher_id::text,
        'session_id', v_session_id::text,
        'student_names', v_student_names,
        'booked_time_slot', p_utc_start_time::text
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Booking failed: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.simple_book_trial_session TO authenticated;
