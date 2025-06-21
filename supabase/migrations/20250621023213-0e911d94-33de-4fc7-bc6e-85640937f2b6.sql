
-- Enhance sessions table with trial-specific fields
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS trial_outcome TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS trial_outcome_notes TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS trial_outcome_submitted_by UUID;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS trial_outcome_submitted_at TIMESTAMPTZ;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS reschedule_reason TEXT;

-- Create payment_links table for sales follow-up management
CREATE TABLE IF NOT EXISTS public.payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_ids UUID[] NOT NULL,
  package_id UUID,
  currency TEXT NOT NULL DEFAULT 'usd',
  amount INTEGER NOT NULL,
  stripe_session_id TEXT,
  created_by UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  clicked_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create whatsapp_contacts table for contact attempt tracking
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  contacted_by UUID NOT NULL,
  contacted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  contact_type TEXT NOT NULL DEFAULT 'trial_confirmation',
  success BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sales_followups table for custom scheduling
CREATE TABLE IF NOT EXISTS public.sales_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  sales_agent_id UUID NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create trial_outcomes table for detailed trial tracking
CREATE TABLE IF NOT EXISTS public.trial_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  session_id UUID,
  outcome TEXT NOT NULL CHECK (outcome IN ('completed', 'ghosted', 'rescheduled')),
  teacher_notes TEXT,
  student_behavior TEXT,
  recommended_package TEXT,
  submitted_by UUID NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_outcomes ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_links
CREATE POLICY "Sales agents can view payment links they created" 
  ON public.payment_links FOR SELECT 
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
  ));

CREATE POLICY "Sales agents can create payment links" 
  ON public.payment_links FOR INSERT 
  WITH CHECK (created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('sales', 'admin')
  ));

-- RLS policies for whatsapp_contacts
CREATE POLICY "Teachers can view their contact attempts" 
  ON public.whatsapp_contacts FOR SELECT 
  USING (contacted_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
  ));

CREATE POLICY "Teachers can log contact attempts" 
  ON public.whatsapp_contacts FOR INSERT 
  WITH CHECK (contacted_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  ));

-- RLS policies for sales_followups
CREATE POLICY "Sales agents can manage their followups" 
  ON public.sales_followups FOR ALL 
  USING (sales_agent_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
  ));

-- RLS policies for trial_outcomes
CREATE POLICY "Teachers can submit trial outcomes" 
  ON public.trial_outcomes FOR INSERT 
  WITH CHECK (submitted_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  ));

CREATE POLICY "Users can view relevant trial outcomes" 
  ON public.trial_outcomes FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
  ) OR submitted_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.students s WHERE s.id = student_id AND s.assigned_sales_agent_id = auth.uid()
  ));

-- Create RPC function for submitting trial outcomes
CREATE OR REPLACE FUNCTION public.submit_trial_outcome(
  p_student_id UUID,
  p_session_id UUID,
  p_outcome TEXT,
  p_teacher_notes TEXT DEFAULT NULL,
  p_student_behavior TEXT DEFAULT NULL,
  p_recommended_package TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_outcome_id UUID;
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
  ELSIF p_outcome = 'ghosted' THEN
    UPDATE public.students 
    SET status = 'trial-ghosted', updated_at = now()
    WHERE id = p_student_id;
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
    'message', 'Trial outcome submitted successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to submit trial outcome: %', SQLERRM;
END;
$$;

-- Create RPC function for logging WhatsApp contacts
CREATE OR REPLACE FUNCTION public.log_whatsapp_contact(
  p_student_id UUID,
  p_contact_type TEXT DEFAULT 'trial_confirmation',
  p_success BOOLEAN DEFAULT true,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  -- Update student status if successful contact for trial confirmation
  IF p_success AND p_contact_type = 'trial_confirmation' THEN
    UPDATE public.students 
    SET status = 'confirmed', updated_at = now()
    WHERE id = p_student_id AND status = 'pending';
  END IF;
  
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.submit_trial_outcome TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_whatsapp_contact TO authenticated;
