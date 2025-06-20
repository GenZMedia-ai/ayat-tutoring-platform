
-- Phase 1: Fix the search_available_teachers function to return all 30-minute slots
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
SECURITY DEFINER
SET search_path = public
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
        AND p.teacher_type = ANY(p_teacher_types)
    ORDER BY ta.time_slot, p.full_name;
END;
$$;

-- Phase 2: Update book_trial_session to add better validation and error handling
CREATE OR REPLACE FUNCTION public.book_trial_session(
    p_booking_data jsonb,
    p_is_multi_student boolean,
    p_selected_date date,
    p_utc_start_time time,
    p_teacher_type text,
    p_available_teacher_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id uuid;
    v_user_role text;
    v_selected_teacher_id uuid;
    v_teacher_name text;
    v_session_id uuid;
    v_student_ids uuid[] := '{}';
    v_student_names text[] := '{}';
    v_student_record record;
    v_unique_id text;
    v_availability_check integer;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- Check authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION USING 
            ERRCODE = 'P0001',
            MESSAGE = 'Authentication required';
    END IF;
    
    -- Check authorization (sales agents only)
    SELECT role INTO v_user_role 
    FROM public.profiles 
    WHERE id = v_user_id AND status = 'approved';
    
    IF v_user_role IS NULL OR v_user_role NOT IN ('sales', 'admin') THEN
        RAISE EXCEPTION USING 
            ERRCODE = 'P0002',
            MESSAGE = 'Access denied - sales agent role required';
    END IF;
    
    -- Validate required booking data
    IF p_booking_data IS NULL OR 
       (NOT p_is_multi_student AND (p_booking_data->>'studentName' IS NULL OR p_booking_data->>'age' IS NULL)) OR
       (p_is_multi_student AND (p_booking_data->>'students' IS NULL OR jsonb_array_length(p_booking_data->'students') = 0)) OR
       p_booking_data->>'phone' IS NULL OR 
       p_booking_data->>'country' IS NULL OR 
       p_booking_data->>'platform' IS NULL THEN
        RAISE EXCEPTION USING 
            ERRCODE = 'P0004',
            MESSAGE = 'Invalid booking data provided';
    END IF;
    
    -- Validate that the exact time slot is available
    SELECT COUNT(*) INTO v_availability_check
    FROM public.teacher_availability ta
    JOIN public.profiles p ON p.id = ta.teacher_id
    WHERE ta.date = p_selected_date
      AND ta.time_slot = p_utc_start_time
      AND ta.is_available = true
      AND ta.is_booked = false
      AND ta.teacher_id = ANY(p_available_teacher_ids)
      AND p.status = 'approved'
      AND p.role = 'teacher'
      AND (p.teacher_type = p_teacher_type OR p.teacher_type = 'mixed');
    
    IF v_availability_check = 0 THEN
        RAISE EXCEPTION USING 
            ERRCODE = 'P0003',
            MESSAGE = 'No teachers available for the exact time slot ' || p_utc_start_time::text;
    END IF;
    
    -- Round-robin teacher selection with row locking
    SELECT ta.teacher_id, p.full_name 
    INTO v_selected_teacher_id, v_teacher_name
    FROM public.teacher_availability ta
    JOIN public.profiles p ON p.id = ta.teacher_id
    WHERE ta.date = p_selected_date
      AND ta.time_slot = p_utc_start_time
      AND ta.is_available = true
      AND ta.is_booked = false
      AND ta.teacher_id = ANY(p_available_teacher_ids)
      AND p.status = 'approved'
      AND p.role = 'teacher'
      AND (p.teacher_type = p_teacher_type OR p.teacher_type = 'mixed')
    ORDER BY (
        SELECT COUNT(*) 
        FROM public.students s 
        WHERE s.assigned_teacher_id = ta.teacher_id 
        AND s.created_at >= CURRENT_DATE - INTERVAL '30 days'
    ) ASC, -- Least assigned teacher first
    RANDOM() -- Random tie-breaker
    LIMIT 1
    FOR UPDATE OF ta; -- Lock the availability slot
    
    -- Double-check if teacher found after locking
    IF v_selected_teacher_id IS NULL THEN
        RAISE EXCEPTION USING 
            ERRCODE = 'P0003',
            MESSAGE = 'No teachers available for this time slot after validation';
    END IF;
    
    -- Create session first
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
    
    -- Handle single or multi-student booking
    IF p_is_multi_student THEN
        -- Multi-student booking
        FOR v_student_record IN 
            SELECT * FROM jsonb_array_elements(p_booking_data->'students')
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
                v_selected_teacher_id,
                v_user_id,
                p_booking_data->>'parentName',
                COALESCE(p_booking_data->>'notes', ''),
                'trial-scheduled'
            ) RETURNING id INTO v_student_ids[array_length(v_student_ids, 1) + 1];
            
            v_student_names := v_student_names || (v_student_record->>'name');
            
            -- Link student to session
            INSERT INTO public.session_students (session_id, student_id)
            VALUES (v_session_id, v_student_ids[array_length(v_student_ids, 1)]);
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
            v_selected_teacher_id,
            v_user_id,
            COALESCE(p_booking_data->>'notes', ''),
            'trial-scheduled'
        ) RETURNING id INTO v_student_ids[1];
        
        v_student_names := ARRAY[p_booking_data->>'studentName'];
        
        -- Link student to session
        INSERT INTO public.session_students (session_id, student_id)
        VALUES (v_session_id, v_student_ids[1]);
    END IF;
    
    -- Mark teacher availability as booked
    UPDATE public.teacher_availability 
    SET is_booked = true,
        updated_at = NOW()
    WHERE teacher_id = v_selected_teacher_id 
      AND date = p_selected_date 
      AND time_slot = p_utc_start_time;
    
    -- Use helper function to update teacher's last booked timestamp (bypasses RLS)
    PERFORM internal.update_teacher_last_booked(v_selected_teacher_id);
    
    -- Return success response matching frontend expectations
    RETURN jsonb_build_object(
        'success', true,
        'teacher_name', v_teacher_name,
        'teacher_id', v_selected_teacher_id::text,
        'session_id', v_session_id::text,
        'student_names', to_jsonb(v_student_names),
        'booked_time_slot', p_utc_start_time::text
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Enhanced error logging
        RAISE WARNING 'Booking error for user %: % (SQLSTATE: %)', v_user_id, SQLERRM, SQLSTATE;
        
        -- Re-raise custom exceptions with their original error codes
        IF SQLSTATE LIKE 'P00%' THEN
            RAISE;
        ELSE
            -- Log unexpected errors and return generic message
            RAISE EXCEPTION USING 
                ERRCODE = 'P0005',
                MESSAGE = 'Booking failed due to system error: ' || SQLERRM;
        END IF;
END;
$$;
