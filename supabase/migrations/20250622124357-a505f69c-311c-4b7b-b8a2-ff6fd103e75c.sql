
-- Phase 1: Database Infrastructure for Post-Payment Registration Workflow

-- Function to get paid students for a specific teacher
CREATE OR REPLACE FUNCTION public.get_teacher_paid_students(p_teacher_id uuid)
RETURNS TABLE (
  id uuid,
  unique_id text,
  name text,
  age integer,
  phone text,
  country text,
  platform text,
  parent_name text,
  package_session_count integer,
  payment_amount integer,
  payment_currency text,
  payment_date timestamp with time zone,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.unique_id,
    s.name,
    s.age,
    s.phone,
    s.country,
    s.platform,
    s.parent_name,
    COALESCE(pl.package_session_count, 8) as package_session_count,
    pl.amount as payment_amount,
    pl.currency as payment_currency,
    pl.paid_at as payment_date,
    s.notes
  FROM students s
  LEFT JOIN payment_links pl ON s.id = ANY(pl.student_ids) AND pl.status = 'paid'
  WHERE s.assigned_teacher_id = p_teacher_id 
    AND s.status = 'paid'
    AND NOT EXISTS (
      SELECT 1 FROM sessions ses 
      JOIN session_students ss ON ses.id = ss.session_id 
      WHERE ss.student_id = s.id 
        AND ses.session_number > 1
    )
  ORDER BY s.created_at DESC;
END;
$$;

-- Function to complete student registration with bulk session creation
CREATE OR REPLACE FUNCTION public.complete_student_registration(
  p_student_id uuid,
  p_session_data jsonb -- Array of {session_number, date, time}
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_session_record jsonb;
  v_session_id uuid;
  v_total_sessions integer;
BEGIN
  -- Authentication and authorization
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  SELECT role INTO v_user_role 
  FROM public.profiles 
  WHERE id = v_user_id AND status = 'approved';
  
  IF v_user_role NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Only teachers can complete student registration';
  END IF;
  
  -- Validate student is in paid status
  IF NOT EXISTS (
    SELECT 1 FROM students 
    WHERE id = p_student_id 
      AND status = 'paid' 
      AND assigned_teacher_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Student not found or not in paid status';
  END IF;
  
  -- Count total sessions to create
  v_total_sessions := jsonb_array_length(p_session_data);
  
  -- Create all sessions
  FOR v_session_record IN 
    SELECT value FROM jsonb_array_elements(p_session_data)
  LOOP
    INSERT INTO public.sessions (
      session_number,
      scheduled_date,
      scheduled_time,
      status,
      notes
    ) VALUES (
      (v_session_record->>'session_number')::integer,
      (v_session_record->>'date')::date,
      (v_session_record->>'time')::time,
      'scheduled',
      'Paid session - registration completed'
    ) RETURNING id INTO v_session_id;
    
    -- Link session to student
    INSERT INTO public.session_students (session_id, student_id)
    VALUES (v_session_id, p_student_id);
  END LOOP;
  
  -- Update student status to active
  UPDATE public.students 
  SET status = 'active', updated_at = now()
  WHERE id = p_student_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'sessions_created', v_total_sessions,
    'student_status', 'active',
    'message', 'Student registration completed successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to complete registration: %', SQLERRM;
END;
$$;

-- Function to complete session with detailed information
CREATE OR REPLACE FUNCTION public.complete_session_with_details(
  p_session_id uuid,
  p_actual_minutes integer,
  p_learning_notes text,
  p_attendance_confirmed boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_student_id uuid;
  v_session_number integer;
  v_total_sessions integer;
  v_completed_sessions integer;
BEGIN
  -- Authentication and authorization
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  SELECT role INTO v_user_role 
  FROM public.profiles 
  WHERE id = v_user_id AND status = 'approved';
  
  IF v_user_role NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Only teachers can complete sessions';
  END IF;
  
  -- Get session details
  SELECT ss.student_id, s.session_number 
  INTO v_student_id, v_session_number
  FROM sessions s
  JOIN session_students ss ON s.id = ss.session_id
  WHERE s.id = p_session_id AND s.status = 'scheduled';
  
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Session not found or already completed';
  END IF;
  
  -- Update session with completion details
  UPDATE public.sessions 
  SET 
    status = 'completed',
    actual_minutes = p_actual_minutes,
    notes = p_learning_notes,
    completed_at = now(),
    updated_at = now()
  WHERE id = p_session_id;
  
  -- Count total and completed sessions for this student
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed
  INTO v_total_sessions, v_completed_sessions
  FROM sessions s
  JOIN session_students ss ON s.id = ss.session_id
  WHERE ss.student_id = v_student_id;
  
  -- Check if all sessions are completed
  IF v_completed_sessions >= v_total_sessions THEN
    UPDATE public.students 
    SET status = 'expired', updated_at = now()
    WHERE id = v_student_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'session_completed', true,
      'subscription_completed', true,
      'student_status', 'expired',
      'progress', jsonb_build_object(
        'completed_sessions', v_completed_sessions,
        'total_sessions', v_total_sessions
      )
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'session_completed', true,
    'subscription_completed', false,
    'student_status', 'active',
    'progress', jsonb_build_object(
      'completed_sessions', v_completed_sessions,
      'total_sessions', v_total_sessions
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to complete session: %', SQLERRM;
END;
$$;

-- Function to check and handle subscription completion
CREATE OR REPLACE FUNCTION public.check_subscription_completion(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_sessions integer;
  v_completed_sessions integer;
  v_student_status text;
BEGIN
  -- Count sessions for student
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed
  INTO v_total_sessions, v_completed_sessions
  FROM sessions s
  JOIN session_students ss ON s.id = ss.session_id
  WHERE ss.student_id = p_student_id;
  
  -- Get current student status
  SELECT status INTO v_student_status FROM students WHERE id = p_student_id;
  
  -- Auto-transition to expired if all sessions completed
  IF v_completed_sessions >= v_total_sessions AND v_student_status = 'active' THEN
    UPDATE public.students 
    SET status = 'expired', updated_at = now()
    WHERE id = p_student_id;
    
    v_student_status := 'expired';
  END IF;
  
  RETURN jsonb_build_object(
    'total_sessions', v_total_sessions,
    'completed_sessions', v_completed_sessions,
    'student_status', v_student_status,
    'completion_percentage', 
      CASE WHEN v_total_sessions > 0 
        THEN ROUND((v_completed_sessions::decimal / v_total_sessions::decimal) * 100, 1)
        ELSE 0 
      END
  );
END;
$$;

-- Add package session count tracking to payment links
ALTER TABLE public.payment_links 
ADD COLUMN IF NOT EXISTS package_session_count integer DEFAULT 8;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_teacher_paid_students TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_student_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_session_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_subscription_completion TO authenticated;
