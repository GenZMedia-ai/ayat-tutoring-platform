
-- Phase 1: Fix Family Trial Session Linking Bug
-- This migration fixes the critical issue where only one student per family gets linked to sessions

-- 1. Update book_family_trial_session to link ALL family students to the session
CREATE OR REPLACE FUNCTION public.book_family_trial_session(
    p_booking_data jsonb,
    p_selected_date date,
    p_utc_start_time time,
    p_teacher_type text,
    p_teacher_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id uuid;
    v_user_role text;
    v_teacher_name text;
    v_session_id uuid;
    v_family_group_id uuid;
    v_family_unique_id text;
    v_student_record jsonb;
    v_student_names text := '';
    v_student_count integer := 0;
    v_student_id uuid;
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
        
        -- CRITICAL FIX: Link EACH student to the session (not just the first one)
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
        'booked_time_slot', p_utc_start_time::text
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Family booking failed: %', SQLERRM;
END;
$$;

-- 2. Enhanced ensure_family_session_links function with better repair logic
CREATE OR REPLACE FUNCTION public.ensure_family_session_links()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_links_created INTEGER := 0;
  v_families_repaired INTEGER := 0;
  v_family_record RECORD;
  v_student_record RECORD;
  v_session_id UUID;
BEGIN
  -- Find family groups that have sessions but potentially missing student links
  FOR v_family_record IN
    SELECT DISTINCT fg.id as family_group_id, fg.trial_date, fg.trial_time, fg.parent_name
    FROM family_groups fg
    WHERE fg.trial_date IS NOT NULL 
      AND fg.trial_time IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM students s 
        WHERE s.family_group_id = fg.id
      )
  LOOP
    -- Find the session for this family's trial date/time
    SELECT id INTO v_session_id
    FROM sessions
    WHERE scheduled_date = v_family_record.trial_date
      AND scheduled_time = v_family_record.trial_time
    LIMIT 1;
    
    -- If session exists, ensure ALL family students are linked
    IF v_session_id IS NOT NULL THEN
      -- Check each student in this family
      FOR v_student_record IN
        SELECT id, name FROM students 
        WHERE family_group_id = v_family_record.family_group_id
      LOOP
        -- Check if this student is linked to the session
        IF NOT EXISTS (
          SELECT 1 FROM session_students
          WHERE session_id = v_session_id AND student_id = v_student_record.id
        ) THEN
          -- Create the missing link
          INSERT INTO session_students (session_id, student_id)
          VALUES (v_session_id, v_student_record.id);
          
          v_links_created := v_links_created + 1;
        END IF;
      END LOOP;
      
      -- Count this family as repaired if we created any links
      IF v_links_created > 0 THEN
        v_families_repaired := v_families_repaired + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'links_created', v_links_created,
    'families_repaired', v_families_repaired,
    'message', CASE 
      WHEN v_links_created > 0 THEN 
        'Family session links repaired: ' || v_links_created || ' missing links created for ' || v_families_repaired || ' families'
      ELSE 
        'All family session links are properly configured'
    END
  );
END;
$$;

-- 3. Enhanced submit_trial_outcome with better family handling and validation
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
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_outcome_id UUID;
  v_family_group_id UUID;
  v_session_exists BOOLEAN := FALSE;
  v_students_updated INTEGER := 0;
  v_family_students_count INTEGER := 0;
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
  
  -- Get family group ID if student belongs to a family
  SELECT family_group_id INTO v_family_group_id
  FROM public.students
  WHERE id = p_student_id;
  
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
  
  RETURN jsonb_build_object(
    'success', true,
    'outcome_id', v_outcome_id,
    'family_group_id', v_family_group_id,
    'students_updated', v_students_updated,
    'is_family_trial', v_family_group_id IS NOT NULL,
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
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.book_family_trial_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_family_session_links TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_trial_outcome TO authenticated;
