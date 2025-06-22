
-- Phase 1: Database Schema Updates

-- Step 1.1: Add package session tracking fields to students table
ALTER TABLE public.students 
ADD COLUMN package_session_count INTEGER DEFAULT 0,
ADD COLUMN completed_sessions INTEGER DEFAULT 0,
ADD COLUMN package_purchased_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN registration_completed_at TIMESTAMP WITH TIME ZONE;

-- Step 1.2: Create session reminders table
CREATE TABLE public.session_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('8am_daily', '1h_before', '15min_before')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for session_reminders
ALTER TABLE public.session_reminders ENABLE ROW LEVEL SECURITY;

-- Create policy for session_reminders
CREATE POLICY "Teachers can view their session reminders" 
  ON public.session_reminders 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.session_students ss ON s.id = ss.session_id
      JOIN public.students st ON ss.student_id = st.id
      WHERE s.id = session_reminders.session_id 
      AND st.assigned_teacher_id = auth.uid()
    )
  );

-- Step 1.3: Create new RPC functions

-- Function to get teacher's paid students requiring registration
CREATE OR REPLACE FUNCTION public.get_teacher_paid_students(p_teacher_id UUID)
RETURNS TABLE(
  id UUID,
  unique_id TEXT,
  name TEXT,
  age INTEGER,
  phone TEXT,
  country TEXT,
  platform TEXT,
  package_session_count INTEGER,
  package_purchased_at TIMESTAMP WITH TIME ZONE,
  parent_name TEXT,
  notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    s.package_session_count,
    s.package_purchased_at,
    s.parent_name,
    s.notes
  FROM public.students s
  WHERE s.assigned_teacher_id = p_teacher_id
    AND s.status = 'paid'
    AND s.registration_completed_at IS NULL
  ORDER BY s.package_purchased_at DESC;
END;
$function$;

-- Function to complete student registration with session scheduling
CREATE OR REPLACE FUNCTION public.complete_student_registration(
  p_student_id UUID,
  p_session_schedules JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_session_record JSONB;
  v_session_id UUID;
  v_session_count INTEGER := 0;
  v_package_count INTEGER;
  v_student_name TEXT;
BEGIN
  -- Get current user and validate
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check authorization
  SELECT role INTO v_user_role 
  FROM public.profiles 
  WHERE id = v_user_id AND status = 'approved';
  
  IF v_user_role NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Only teachers can complete registration';
  END IF;
  
  -- Get student details and package count
  SELECT name, package_session_count INTO v_student_name, v_package_count
  FROM public.students 
  WHERE id = p_student_id AND assigned_teacher_id = v_user_id AND status = 'paid';
  
  IF v_student_name IS NULL THEN
    RAISE EXCEPTION 'Student not found or not assigned to you';
  END IF;
  
  -- Validate session count matches package
  v_session_count := jsonb_array_length(p_session_schedules);
  IF v_session_count != v_package_count THEN
    RAISE EXCEPTION 'Session count (%) does not match package count (%)', v_session_count, v_package_count;
  END IF;
  
  -- Create sessions for each scheduled slot
  FOR v_session_record IN 
    SELECT value FROM jsonb_array_elements(p_session_schedules)
  LOOP
    -- Verify time slot is available
    IF EXISTS (
      SELECT 1 FROM public.teacher_availability
      WHERE teacher_id = v_user_id
        AND date = (v_session_record->>'date')::DATE
        AND time_slot = (v_session_record->>'time')::TIME
        AND (is_booked = true OR is_available = false)
    ) THEN
      RAISE EXCEPTION 'Time slot % % is not available', 
        v_session_record->>'date', v_session_record->>'time';
    END IF;
    
    -- Create session
    INSERT INTO public.sessions (
      scheduled_date,
      scheduled_time,
      session_number,
      status,
      notes
    ) VALUES (
      (v_session_record->>'date')::DATE,
      (v_session_record->>'time')::TIME,
      (v_session_record->>'sessionNumber')::INTEGER,
      'scheduled',
      'Package session created during registration'
    ) RETURNING id INTO v_session_id;
    
    -- Link session to student
    INSERT INTO public.session_students (session_id, student_id)
    VALUES (v_session_id, p_student_id);
    
    -- Mark time slot as booked
    UPDATE public.teacher_availability 
    SET is_booked = true, updated_at = NOW()
    WHERE teacher_id = v_user_id 
      AND date = (v_session_record->>'date')::DATE 
      AND time_slot = (v_session_record->>'time')::TIME;
  END LOOP;
  
  -- Update student status and registration completion
  UPDATE public.students 
  SET 
    status = 'active',
    registration_completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_student_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'student_id', p_student_id,
    'sessions_created', v_session_count,
    'message', 'Registration completed successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Registration failed: %', SQLERRM;
END;
$function$;

-- Function to complete session with details
CREATE OR REPLACE FUNCTION public.complete_session_with_details(
  p_session_id UUID,
  p_actual_minutes INTEGER,
  p_learning_notes TEXT,
  p_attendance_confirmed BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_student_id UUID;
  v_completed_count INTEGER;
  v_package_count INTEGER;
BEGIN
  -- Get current user and validate
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check authorization
  SELECT role INTO v_user_role 
  FROM public.profiles 
  WHERE id = v_user_id AND status = 'approved';
  
  IF v_user_role NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Only teachers can complete sessions';
  END IF;
  
  -- Validate input
  IF p_actual_minutes < 10 OR p_actual_minutes > 90 THEN
    RAISE EXCEPTION 'Actual minutes must be between 10 and 90';
  END IF;
  
  IF p_learning_notes IS NULL OR LENGTH(p_learning_notes) < 10 THEN
    RAISE EXCEPTION 'Learning notes are required (minimum 10 characters)';
  END IF;
  
  -- Update session with completion details
  UPDATE public.sessions 
  SET 
    status = 'completed',
    actual_minutes = p_actual_minutes,
    notes = p_learning_notes,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id
  RETURNING (
    SELECT ss.student_id 
    FROM public.session_students ss 
    WHERE ss.session_id = p_session_id
    LIMIT 1
  ) INTO v_student_id;
  
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Session not found or not authorized';
  END IF;
  
  -- Increment completed sessions counter
  UPDATE public.students 
  SET 
    completed_sessions = completed_sessions + 1,
    updated_at = NOW()
  WHERE id = v_student_id
  RETURNING completed_sessions, package_session_count 
  INTO v_completed_count, v_package_count;
  
  -- Check if package is complete
  IF v_completed_count >= v_package_count THEN
    UPDATE public.students 
    SET status = 'expired', updated_at = NOW()
    WHERE id = v_student_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'student_id', v_student_id,
    'completed_sessions', v_completed_count,
    'package_sessions', v_package_count,
    'package_complete', v_completed_count >= v_package_count,
    'message', 'Session completed successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Session completion failed: %', SQLERRM;
END;
$function$;

-- Function to check subscription completion
CREATE OR REPLACE FUNCTION public.check_subscription_completion(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_completed_count INTEGER;
  v_package_count INTEGER;
  v_status TEXT;
BEGIN
  SELECT completed_sessions, package_session_count, status
  INTO v_completed_count, v_package_count, v_status
  FROM public.students 
  WHERE id = p_student_id;
  
  IF v_completed_count IS NULL THEN
    RAISE EXCEPTION 'Student not found';
  END IF;
  
  RETURN jsonb_build_object(
    'student_id', p_student_id,
    'completed_sessions', v_completed_count,
    'package_sessions', v_package_count,
    'completion_percentage', ROUND((v_completed_count::DECIMAL / v_package_count) * 100, 2),
    'is_complete', v_completed_count >= v_package_count,
    'current_status', v_status
  );
END;
$function$;
