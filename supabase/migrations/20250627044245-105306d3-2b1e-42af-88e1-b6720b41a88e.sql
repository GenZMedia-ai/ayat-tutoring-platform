
-- Add the missing created_by column to the existing sales_followups table
ALTER TABLE public.sales_followups 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

-- Add the missing family_group_id column if it doesn't exist
ALTER TABLE public.sales_followups 
ADD COLUMN IF NOT EXISTS family_group_id UUID REFERENCES public.family_groups(id);

-- Add the missing scheduled_time column if it doesn't exist
ALTER TABLE public.sales_followups 
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- Update the constraint to handle the new structure (fix syntax)
ALTER TABLE public.sales_followups 
DROP CONSTRAINT IF EXISTS followup_target_check;

ALTER TABLE public.sales_followups 
ADD CONSTRAINT followup_target_check CHECK (
  (student_id IS NOT NULL AND family_group_id IS NULL) OR
  (student_id IS NULL AND family_group_id IS NOT NULL)
);

-- Create RPC function for creating sales follow-up (fix parameter order)
CREATE OR REPLACE FUNCTION public.create_sales_followup(
  p_scheduled_date DATE,
  p_scheduled_time TIME,
  p_reason TEXT,
  p_sales_agent_id UUID,
  p_student_id UUID DEFAULT NULL,
  p_family_group_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_followup_id UUID;
  v_current_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate that exactly one target is provided
  IF (p_student_id IS NULL AND p_family_group_id IS NULL) OR 
     (p_student_id IS NOT NULL AND p_family_group_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Exactly one of student_id or family_group_id must be provided';
  END IF;

  INSERT INTO public.sales_followups (
    student_id,
    family_group_id,
    sales_agent_id,
    scheduled_date,
    scheduled_time,
    reason,
    notes,
    created_by
  ) VALUES (
    p_student_id,
    p_family_group_id,
    p_sales_agent_id,
    p_scheduled_date,
    p_scheduled_time,
    p_reason,
    p_notes,
    v_current_user_id
  ) RETURNING id INTO v_followup_id;

  RETURN jsonb_build_object(
    'success', true,
    'followup_id', v_followup_id,
    'message', 'Follow-up scheduled successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Create RPC function for updating sales follow-up (fix parameter order)
CREATE OR REPLACE FUNCTION public.update_sales_followup(
  p_followup_id UUID,
  p_scheduled_date DATE,
  p_scheduled_time TIME,
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.sales_followups 
  SET 
    scheduled_date = p_scheduled_date,
    scheduled_time = p_scheduled_time,
    reason = p_reason,
    notes = p_notes,
    updated_at = NOW()
  WHERE id = p_followup_id 
    AND (sales_agent_id = v_current_user_id OR created_by = v_current_user_id);

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Follow-up not found or access denied'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Follow-up updated successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
