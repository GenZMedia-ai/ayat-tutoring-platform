
-- Phase 1: Database Schema Updates for Follow-up Status

-- 1. Add follow-up status to constraint (currently missing)
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_status_check;
ALTER TABLE public.students ADD CONSTRAINT students_status_check 
CHECK (status IN (
  'pending', 'confirmed', 'trial-completed', 'trial-ghosted',
  'follow-up', 'awaiting-payment', 'paid', 'active', 'expired', 'cancelled', 'dropped'
));

-- 2. Add notification tracking for idempotency
ALTER TABLE public.sales_followups 
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE;

-- 3. Prevent duplicate follow-ups (race condition protection)
ALTER TABLE public.sales_followups 
ADD CONSTRAINT unique_active_followup 
UNIQUE (student_id, completed) 
DEFERRABLE INITIALLY DEFERRED;

-- 4. Performance index for scheduled notifications
CREATE INDEX IF NOT EXISTS idx_sales_followups_notification_check 
ON public.sales_followups(scheduled_date, notification_sent, completed) 
WHERE completed = false AND notification_sent = false;

-- 5. Data migration safety - mark existing records as already notified
UPDATE public.sales_followups 
SET notification_sent = true 
WHERE notification_sent IS NULL OR notification_sent = false;

-- 6. Create atomic status transition function
CREATE OR REPLACE FUNCTION schedule_student_followup(
  p_student_id UUID,
  p_sales_agent_id UUID,
  p_scheduled_date_utc TIMESTAMPTZ,
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_followup_id UUID;
  v_student_status TEXT;
BEGIN
  -- Check current student status
  SELECT status INTO v_student_status 
  FROM students 
  WHERE id = p_student_id;
  
  IF v_student_status IS NULL THEN
    RAISE EXCEPTION 'Student not found';
  END IF;
  
  IF v_student_status NOT IN ('trial-completed', 'follow-up') THEN
    RAISE EXCEPTION 'Student must be in trial-completed or follow-up status';
  END IF;
  
  -- If already in follow-up, update existing record
  IF v_student_status = 'follow-up' THEN
    UPDATE sales_followups 
    SET scheduled_date = p_scheduled_date_utc,
        reason = p_reason,
        notes = p_notes,
        notification_sent = false,
        updated_at = NOW()
    WHERE student_id = p_student_id 
      AND completed = false
    RETURNING id INTO v_followup_id;
  ELSE
    -- Create new follow-up record
    INSERT INTO sales_followups (
      student_id, sales_agent_id, scheduled_date, 
      reason, notes, completed, notification_sent
    ) VALUES (
      p_student_id, p_sales_agent_id, p_scheduled_date_utc,
      p_reason, p_notes, false, false
    ) RETURNING id INTO v_followup_id;
    
    -- Update student status to follow-up
    UPDATE students 
    SET status = 'follow-up', updated_at = NOW()
    WHERE id = p_student_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'followup_id', v_followup_id,
    'student_id', p_student_id,
    'message', 'Follow-up scheduled successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to complete follow-up
CREATE OR REPLACE FUNCTION complete_student_followup(
  p_followup_id UUID,
  p_outcome TEXT, -- 'awaiting-payment', 'paid', 'dropped'
  p_notes TEXT DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_student_id UUID;
  v_rows_affected INTEGER;
BEGIN
  -- Get student ID and mark follow-up as completed
  UPDATE sales_followups 
  SET completed = true,
      completed_at = NOW(),
      outcome = p_outcome,
      notes = COALESCE(p_notes, notes)
  WHERE id = p_followup_id 
    AND completed = false
  RETURNING student_id INTO v_student_id;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  IF v_rows_affected = 0 THEN
    RAISE EXCEPTION 'Follow-up not found or already completed';
  END IF;
  
  -- Update student status based on outcome
  UPDATE students 
  SET status = p_outcome, updated_at = NOW()
  WHERE id = v_student_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'student_id', v_student_id,
    'outcome', p_outcome,
    'message', 'Follow-up completed successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION schedule_student_followup(UUID, UUID, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_student_followup(UUID, TEXT, TEXT) TO authenticated;
