
-- Enhanced submit_trial_outcome function to handle both individual students and family groups
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
AS $function$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_outcome_id UUID;
  v_family_group_id UUID;
  v_session_exists BOOLEAN := FALSE;
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
  
  -- Validate session exists and belongs to the student
  SELECT EXISTS(
    SELECT 1 FROM sessions s
    JOIN session_students ss ON s.id = ss.session_id
    WHERE s.id = p_session_id AND ss.student_id = p_student_id
  ) INTO v_session_exists;
  
  IF NOT v_session_exists THEN
    RAISE EXCEPTION 'Session not found or not linked to student';
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
  
  -- Update individual student status based on outcome
  IF p_outcome = 'completed' THEN
    UPDATE public.students 
    SET status = 'trial-completed', updated_at = now()
    WHERE id = p_student_id;
  ELSIF p_outcome = 'ghosted' THEN
    UPDATE public.students 
    SET status = 'trial-ghosted', updated_at = now()
    WHERE id = p_student_id;
  END IF;
  
  -- CRITICAL FIX: Update family group status if student belongs to a family
  IF v_family_group_id IS NOT NULL THEN
    -- Update all students in the family group to the same status
    IF p_outcome = 'completed' THEN
      UPDATE public.students 
      SET status = 'trial-completed', updated_at = now()
      WHERE family_group_id = v_family_group_id;
      
      -- Update family group status
      UPDATE public.family_groups
      SET status = 'trial-completed', updated_at = now()
      WHERE id = v_family_group_id;
      
    ELSIF p_outcome = 'ghosted' THEN
      UPDATE public.students 
      SET status = 'trial-ghosted', updated_at = now()
      WHERE family_group_id = v_family_group_id;
      
      -- Update family group status
      UPDATE public.family_groups
      SET status = 'trial-ghosted', updated_at = now()
      WHERE id = v_family_group_id;
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
    'students_updated', CASE 
      WHEN v_family_group_id IS NOT NULL THEN (
        SELECT COUNT(*) FROM students WHERE family_group_id = v_family_group_id
      ) 
      ELSE 1 
    END,
    'message', 'Trial outcome submitted successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to submit trial outcome: %', SQLERRM;
END;
$function$;

-- Enhanced confirm_trial function to handle family groups
CREATE OR REPLACE FUNCTION public.confirm_trial(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_rows_affected INTEGER;
  v_family_group_id UUID;
  v_is_family_member BOOLEAN := FALSE;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check authorization (teachers and admins only)
  SELECT role INTO v_user_role 
  FROM public.profiles 
  WHERE id = v_user_id AND status = 'approved';
  
  IF v_user_role NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Only teachers and admins can confirm trials';
  END IF;
  
  -- Check if this is a family member and get family group ID
  SELECT family_group_id INTO v_family_group_id
  FROM public.students 
  WHERE id = p_student_id;
  
  IF v_family_group_id IS NOT NULL THEN
    v_is_family_member := TRUE;
  END IF;
  
  -- Update student status from pending to confirmed
  UPDATE public.students 
  SET status = 'confirmed', updated_at = now()
  WHERE id = p_student_id AND status = 'pending';
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  -- If this is a family member, update all family members and the family group
  IF v_is_family_member AND v_rows_affected > 0 THEN
    -- Update all other students in the family group
    UPDATE public.students 
    SET status = 'confirmed', updated_at = now()
    WHERE family_group_id = v_family_group_id AND status = 'pending';
    
    -- Update family group status
    UPDATE public.family_groups
    SET status = 'confirmed', updated_at = now()
    WHERE id = v_family_group_id AND status = 'pending';
  END IF;
  
  -- Check if update was successful
  IF v_rows_affected = 0 THEN
    -- Check if student exists but is not in pending status
    IF EXISTS (SELECT 1 FROM public.students WHERE id = p_student_id) THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Student is not in pending status and cannot be confirmed'
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Student not found'
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'student_id', p_student_id,
    'is_family_member', v_is_family_member,
    'family_group_id', v_family_group_id,
    'message', CASE 
      WHEN v_is_family_member THEN 'Family trial confirmed successfully'
      ELSE 'Student trial confirmed successfully'
    END
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to confirm trial: %', SQLERRM;
END;
$function$;

-- Add session linking validation and repair function
CREATE OR REPLACE FUNCTION public.ensure_family_session_links()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_links_created INTEGER := 0;
  v_family_record RECORD;
  v_first_student_id UUID;
  v_session_id UUID;
BEGIN
  -- Find family groups that have sessions but missing student links
  FOR v_family_record IN
    SELECT DISTINCT fg.id as family_group_id, fg.trial_date, fg.trial_time
    FROM family_groups fg
    WHERE fg.trial_date IS NOT NULL 
      AND fg.trial_time IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM students s 
        WHERE s.family_group_id = fg.id
      )
  LOOP
    -- Get the first student from this family
    SELECT id INTO v_first_student_id
    FROM students 
    WHERE family_group_id = v_family_record.family_group_id
    LIMIT 1;
    
    -- Find the session for this family's trial date/time
    SELECT id INTO v_session_id
    FROM sessions
    WHERE scheduled_date = v_family_record.trial_date
      AND scheduled_time = v_family_record.trial_time
    LIMIT 1;
    
    -- If we found both student and session, ensure they're linked
    IF v_first_student_id IS NOT NULL AND v_session_id IS NOT NULL THEN
      -- Check if link already exists
      IF NOT EXISTS (
        SELECT 1 FROM session_students
        WHERE session_id = v_session_id AND student_id = v_first_student_id
      ) THEN
        -- Create the missing link
        INSERT INTO session_students (session_id, student_id)
        VALUES (v_session_id, v_first_student_id);
        
        v_links_created := v_links_created + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'links_created', v_links_created,
    'message', 'Family session links validated and repaired'
  );
END;
$function$;
