
-- Phase 1: Database Function Refactoring

-- 1.1 Update log_whatsapp_contact function to remove automatic status update
CREATE OR REPLACE FUNCTION public.log_whatsapp_contact(
  p_student_id uuid,
  p_contact_type text DEFAULT 'trial_confirmation'::text,
  p_success boolean DEFAULT true,
  p_notes text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_attempt_number INTEGER;
  v_contact_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get next attempt number
  SELECT COALESCE(MAX(attempt_number), 0) + 1 
  INTO v_attempt_number
  FROM public.whatsapp_contacts 
  WHERE student_id = p_student_id AND contact_type = p_contact_type;
  
  -- Insert contact log
  INSERT INTO public.whatsapp_contacts (
    student_id,
    contacted_by,
    attempt_number,
    contact_type,
    success,
    notes
  ) VALUES (
    p_student_id,
    v_user_id,
    v_attempt_number,
    p_contact_type,
    p_success,
    p_notes
  ) RETURNING id INTO v_contact_id;
  
  -- REMOVED: Automatic status update logic
  -- This function now only logs contact attempts
  
  RETURN jsonb_build_object(
    'success', true,
    'contact_id', v_contact_id,
    'attempt_number', v_attempt_number
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to log contact: %', SQLERRM;
END;
$$;

-- 1.2 Create new confirm_trial function for dedicated status updates
CREATE OR REPLACE FUNCTION public.confirm_trial(
  p_student_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_rows_affected INTEGER;
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
  
  -- Update student status from pending to confirmed
  UPDATE public.students 
  SET status = 'confirmed', updated_at = now()
  WHERE id = p_student_id AND status = 'pending';
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
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
    'message', 'Student trial confirmed successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to confirm trial: %', SQLERRM;
END;
$$;

-- Grant execute permissions for the new function
GRANT EXECUTE ON FUNCTION public.confirm_trial(uuid) TO authenticated;
