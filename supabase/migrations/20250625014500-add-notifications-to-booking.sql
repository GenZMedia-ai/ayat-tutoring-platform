
-- Update simple_book_trial_session to include notifications
CREATE OR REPLACE FUNCTION public.simple_book_trial_session(
    p_booking_data jsonb, 
    p_is_multi_student boolean, 
    p_selected_date date, 
    p_utc_start_time time without time zone, 
    p_teacher_type text, 
    p_teacher_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_user_id uuid;
    v_user_role text;
    v_teacher_name text;
    v_teacher_phone text;
    v_session_id uuid;
    v_student_names text := '';
    v_student_record jsonb;
    v_unique_id text;
    v_first_student_id uuid;
    v_notification_payload jsonb;
    v_notification_sent boolean;
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
    
    -- Get teacher details
    SELECT full_name, phone INTO v_teacher_name, v_teacher_phone
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
    
    -- Send teacher assignment notification
    v_notification_payload := jsonb_build_object(
        'teacher_name', v_teacher_name,
        'teacher_phone', v_teacher_phone,
        'student_names', v_student_names,
        'trial_date', p_selected_date,
        'trial_time', p_utc_start_time,
        'is_multi_student', p_is_multi_student,
        'platform', p_booking_data->>'platform',
        'parent_phone', p_booking_data->>'phone'
    );
    
    SELECT public.send_notification_safe(
        'teacher.student.assigned',
        v_notification_payload
    ) INTO v_notification_sent;
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'teacher_name', v_teacher_name,
        'teacher_id', p_teacher_id::text,
        'session_id', v_session_id::text,
        'student_names', v_student_names,
        'booked_time_slot', p_utc_start_time::text,
        'notification_sent', v_notification_sent
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Booking failed: %', SQLERRM;
END;
$function$;

-- Update book_family_trial_session to include notifications
CREATE OR REPLACE FUNCTION public.book_family_trial_session(
    p_booking_data jsonb, 
    p_selected_date date, 
    p_utc_start_time time without time zone, 
    p_teacher_type text, 
    p_teacher_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_user_id uuid;
    v_user_role text;
    v_teacher_name text;
    v_teacher_phone text;
    v_session_id uuid;
    v_family_group_id uuid;
    v_family_unique_id text;
    v_student_record jsonb;
    v_student_names text := '';
    v_student_count integer := 0;
    v_student_id uuid;
    v_notification_payload jsonb;
    v_notification_sent boolean;
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
    
    -- Get teacher details
    SELECT full_name, phone INTO v_teacher_name, v_teacher_phone
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
    
    -- Generate family unique ID
    v_family_unique_id := public.generate_family_unique_id();
    
    -- Create family group
    INSERT INTO public.family_groups (
        unique_id,
        parent_name,
        phone,
        country,
        platform,
        teacher_type,
        trial_date,
        trial_time,
        assigned_teacher_id,
        assigned_sales_agent_id,
        notes,
        status,
        student_count
    ) VALUES (
        v_family_unique_id,
        p_booking_data->>'parentName',
        p_booking_data->>'phone',
        p_booking_data->>'country',
        p_booking_data->>'platform',
        p_teacher_type,
        p_selected_date,
        p_utc_start_time,
        p_teacher_id,
        v_user_id,
        COALESCE(p_booking_data->>'notes', ''),
        'pending',
        jsonb_array_length(p_booking_data->'students')
    ) RETURNING id INTO v_family_group_id;
    
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
    
    -- Create individual student records linked to family
    FOR v_student_record IN 
        SELECT value FROM jsonb_array_elements(p_booking_data->'students')
    LOOP
        v_student_count := v_student_count + 1;
        
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
            status,
            family_group_id
        ) VALUES (
            v_family_unique_id || '_S' || v_student_count,
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
            'pending',
            v_family_group_id
        ) RETURNING id INTO v_student_id;
        
        -- Link EACH student to the session
        INSERT INTO public.session_students (session_id, student_id)
        VALUES (v_session_id, v_student_id);
        
        -- Build response strings
        IF v_student_names = '' THEN
            v_student_names := v_student_record->>'name';
        ELSE
            v_student_names := v_student_names || ', ' || (v_student_record->>'name');
        END IF;
    END LOOP;
    
    -- Mark slot as booked
    UPDATE public.teacher_availability 
    SET is_booked = true, updated_at = NOW()
    WHERE teacher_id = p_teacher_id 
    AND date = p_selected_date 
    AND time_slot = p_utc_start_time;
    
    -- Update teacher's last booked timestamp
    UPDATE public.profiles 
    SET last_booked_at = NOW() 
    WHERE id = p_teacher_id;
    
    -- Send family assignment notification
    v_notification_payload := jsonb_build_object(
        'teacher_name', v_teacher_name,
        'teacher_phone', v_teacher_phone,
        'parent_name', p_booking_data->>'parentName',
        'parent_phone', p_booking_data->>'phone',
        'student_names', v_student_names,
        'student_count', v_student_count,
        'trial_date', p_selected_date,
        'trial_time', p_utc_start_time,
        'platform', p_booking_data->>'platform',
        'family_unique_id', v_family_unique_id
    );
    
    SELECT public.send_notification_safe(
        'teacher.family.assigned',
        v_notification_payload
    ) INTO v_notification_sent;
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'teacher_name', v_teacher_name,
        'teacher_id', p_teacher_id::text,
        'session_id', v_session_id::text,
        'family_group_id', v_family_group_id::text,
        'family_unique_id', v_family_unique_id,
        'student_names', v_student_names,
        'student_count', v_student_count,
        'students_linked_to_session', v_student_count,
        'booked_time_slot', p_utc_start_time::text,
        'notification_sent', v_notification_sent
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Family booking failed: %', SQLERRM;
END;
$function$;

-- Update submit_trial_outcome to include notifications
CREATE OR REPLACE FUNCTION public.submit_trial_outcome(
    p_student_id uuid, 
    p_session_id uuid, 
    p_outcome text, 
    p_teacher_notes text DEFAULT NULL::text, 
    p_student_behavior text DEFAULT NULL::text, 
    p_recommended_package text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_outcome_id UUID;
  v_family_group_id UUID;
  v_session_exists BOOLEAN := FALSE;
  v_students_updated INTEGER := 0;
  v_family_students_count INTEGER := 0;
  v_student_name TEXT;
  v_parent_phone TEXT;
  v_teacher_name TEXT;
  v_notification_payload JSONB;
  v_notification_sent BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check authentication and authorization
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  SELECT role INTO v_user_role 
  FROM public.profiles 
  WHERE id = v_user_id AND status = 'approved';
  
  IF v_user_role NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Only teachers can submit trial outcomes';
  END IF;
  
  -- Enhanced session validation - check if session exists and student is linked
  SELECT EXISTS(
    SELECT 1 FROM sessions s
    JOIN session_students ss ON s.id = ss.session_id
    WHERE s.id = p_session_id AND ss.student_id = p_student_id
  ) INTO v_session_exists;
  
  IF NOT v_session_exists THEN
    -- Try to repair session links for families before failing
    PERFORM public.ensure_family_session_links();
    
    -- Check again after repair attempt
    SELECT EXISTS(
      SELECT 1 FROM sessions s
      JOIN session_students ss ON s.id = ss.session_id
      WHERE s.id = p_session_id AND ss.student_id = p_student_id
    ) INTO v_session_exists;
    
    IF NOT v_session_exists THEN
      RAISE EXCEPTION 'Session not found or not linked to student';
    END IF;
  END IF;
  
  -- Get student and teacher details for notification
  SELECT s.name, s.phone, s.family_group_id, p.full_name
  INTO v_student_name, v_parent_phone, v_family_group_id, v_teacher_name
  FROM public.students s
  JOIN public.profiles p ON s.assigned_teacher_id = p.id
  WHERE s.id = p_student_id;
  
  -- Insert trial outcome
  INSERT INTO public.trial_outcomes (
    student_id,
    session_id,
    outcome,
    teacher_notes,
    student_behavior,
    recommended_package,
    submitted_by
  ) VALUES (
    p_student_id,
    p_session_id,
    p_outcome,
    p_teacher_notes,
    p_student_behavior,
    p_recommended_package,
    v_user_id
  ) RETURNING id INTO v_outcome_id;
  
  -- Update student status based on outcome
  IF p_outcome = 'completed' THEN
    UPDATE public.students 
    SET status = 'trial-completed', updated_at = now()
    WHERE id = p_student_id;
    v_students_updated := 1;
  ELSIF p_outcome = 'ghosted' THEN
    UPDATE public.students 
    SET status = 'trial-ghosted', updated_at = now()
    WHERE id = p_student_id;
    v_students_updated := 1;
  END IF;
  
  -- ENHANCED: Update family group and all family members if applicable
  IF v_family_group_id IS NOT NULL THEN
    -- Count total family students
    SELECT COUNT(*) INTO v_family_students_count
    FROM public.students 
    WHERE family_group_id = v_family_group_id;
    
    -- Update all students in the family group to the same status
    IF p_outcome = 'completed' THEN
      UPDATE public.students 
      SET status = 'trial-completed', updated_at = now()
      WHERE family_group_id = v_family_group_id;
      
      -- Update family group status
      UPDATE public.family_groups
      SET status = 'trial-completed', updated_at = now()
      WHERE id = v_family_group_id;
      
      GET DIAGNOSTICS v_students_updated = ROW_COUNT;
      v_students_updated := v_family_students_count;
      
    ELSIF p_outcome = 'ghosted' THEN
      UPDATE public.students 
      SET status = 'trial-ghosted', updated_at = now()
      WHERE family_group_id = v_family_group_id;
      
      -- Update family group status
      UPDATE public.family_groups
      SET status = 'trial-ghosted', updated_at = now()
      WHERE id = v_family_group_id;
      
      GET DIAGNOSTICS v_students_updated = ROW_COUNT;
      v_students_updated := v_family_students_count;
    END IF;
  END IF;
  
  -- Update session with trial outcome
  UPDATE public.sessions 
  SET 
    trial_outcome = p_outcome,
    trial_outcome_notes = p_teacher_notes,
    trial_outcome_submitted_by = v_user_id,
    trial_outcome_submitted_at = now(),
    status = CASE 
      WHEN p_outcome = 'completed' THEN 'completed'
      WHEN p_outcome = 'ghosted' THEN 'cancelled'
      ELSE status
    END,
    updated_at = now()
  WHERE id = p_session_id;
  
  -- Send trial outcome notification
  v_notification_payload := jsonb_build_object(
    'outcome', p_outcome,
    'student_name', v_student_name,
    'teacher_name', v_teacher_name,
    'parent_phone', v_parent_phone,
    'teacher_notes', p_teacher_notes,
    'student_behavior', p_student_behavior,
    'recommended_package', p_recommended_package,
    'is_family_trial', v_family_group_id IS NOT NULL,
    'students_affected', v_students_updated
  );
  
  SELECT public.send_notification_safe(
    'trial.outcome.submitted',
    v_notification_payload
  ) INTO v_notification_sent;
  
  RETURN jsonb_build_object(
    'success', true,
    'outcome_id', v_outcome_id,
    'family_group_id', v_family_group_id,
    'students_updated', v_students_updated,
    'is_family_trial', v_family_group_id IS NOT NULL,
    'notification_sent', v_notification_sent,
    'message', CASE 
      WHEN v_family_group_id IS NOT NULL THEN 
        'Family trial outcome submitted successfully for ' || v_students_updated || ' students'
      ELSE 
        'Trial outcome submitted successfully'
    END
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to submit trial outcome: %', SQLERRM;
END;
$function$;
