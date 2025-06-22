
-- Fix the PostgreSQL syntax error in the function
-- Drop the problematic function first
DROP FUNCTION IF EXISTS public.complete_session_with_details(UUID, INTEGER, TEXT, BOOLEAN);

-- Recreate with fixed syntax
CREATE OR REPLACE FUNCTION public.complete_session_with_details(
  session_id_param UUID,
  actual_minutes_param INTEGER,
  completion_notes_param TEXT,
  attendance_confirmed_param BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_student_id UUID;
  v_completed_count INTEGER;
  v_total_sessions INTEGER;
  v_session_exists BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get student_id and verify teacher permission (fixed syntax)
  SELECT ss.student_id INTO v_student_id
  FROM public.sessions s
  JOIN public.session_students ss ON s.id = ss.session_id
  JOIN public.students st ON ss.student_id = st.id
  WHERE s.id = session_id_param 
    AND st.assigned_teacher_id = v_user_id
    AND s.status = 'scheduled';
    
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Session not found or not authorized';
  END IF;
  
  -- Update session completion
  UPDATE public.sessions 
  SET 
    status = 'completed',
    actual_minutes = actual_minutes_param,
    notes = completion_notes_param,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = session_id_param;
  
  -- Update student's completed sessions count
  UPDATE public.students 
  SET 
    completed_sessions = completed_sessions + 1,
    updated_at = NOW()
  WHERE id = v_student_id
  RETURNING completed_sessions, package_session_count 
  INTO v_completed_count, v_total_sessions;
  
  -- Check if all sessions are completed
  IF v_completed_count >= v_total_sessions AND v_total_sessions > 0 THEN
    UPDATE public.students 
    SET status = 'expired', updated_at = NOW()
    WHERE id = v_student_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'session_id', session_id_param,
    'completed_sessions', v_completed_count,
    'total_sessions', v_total_sessions,
    'student_completed', (v_completed_count >= v_total_sessions AND v_total_sessions > 0),
    'message', 'Session completed successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Session completion failed: %', SQLERRM;
END;
$$;
