-- Revert check_subscription_completion function to original state (include trial sessions)
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
  -- Count ALL sessions for student (including trial sessions)
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed
  INTO v_total_sessions, v_completed_sessions
  FROM sessions s
  JOIN session_students ss ON s.id = ss.session_id
  WHERE ss.student_id = p_student_id;
  
  -- Get current student status
  SELECT status INTO v_student_status FROM students WHERE id = p_student_id;
  
  -- Auto-transition to expired if all paid sessions completed
  IF v_completed_sessions >= v_total_sessions AND v_total_sessions > 0 AND v_student_status = 'active' THEN
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