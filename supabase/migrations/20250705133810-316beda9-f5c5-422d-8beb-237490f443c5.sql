-- Phase 1: Database Foundation - Smart Renewal & MMR Implementation
-- Add subscription cycle tracking to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS subscription_cycle integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS first_payment_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS lifetime_revenue integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS renewal_count integer DEFAULT 0;

-- Create student_renewals table for complete renewal history
CREATE TABLE IF NOT EXISTS public.student_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  payment_link_id uuid REFERENCES public.payment_links(id),
  cycle_number integer NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  package_id uuid REFERENCES public.packages(id),
  package_session_count integer NOT NULL DEFAULT 8,
  renewal_source text NOT NULL DEFAULT 'manual', -- manual, auto, teacher_referral
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  notes text
);

-- Enable RLS on student_renewals
ALTER TABLE public.student_renewals ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_renewals
CREATE POLICY "Sales agents can view renewals for their students"
ON public.student_renewals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.id = student_renewals.student_id 
    AND s.assigned_sales_agent_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'supervisor')
  )
);

CREATE POLICY "Sales agents can create renewals"
ON public.student_renewals FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('sales', 'admin')
  )
);

-- Smart renewal payment processor function
CREATE OR REPLACE FUNCTION public.process_renewal_payment(
  p_student_id uuid,
  p_payment_link_id uuid,
  p_amount integer,
  p_currency text,
  p_package_id uuid,
  p_package_session_count integer,
  p_renewal_source text DEFAULT 'manual'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_cycle integer;
  v_current_lifetime_revenue integer;
  v_renewal_id uuid;
  v_student_status text;
BEGIN
  -- Get current student data
  SELECT subscription_cycle, COALESCE(lifetime_revenue, 0), status
  INTO v_current_cycle, v_current_lifetime_revenue, v_student_status
  FROM students WHERE id = p_student_id;
  
  IF v_current_cycle IS NULL THEN
    RAISE EXCEPTION 'Student not found';
  END IF;
  
  -- Increment cycle and update student
  UPDATE students 
  SET 
    subscription_cycle = v_current_cycle + 1,
    lifetime_revenue = v_current_lifetime_revenue + p_amount,
    renewal_count = COALESCE(renewal_count, 0) + 1,
    status = 'paid', -- Reset to paid for new cycle
    package_session_count = p_package_session_count,
    updated_at = now(),
    first_payment_date = COALESCE(first_payment_date, now()) -- Set if first time
  WHERE id = p_student_id;
  
  -- Record renewal history
  INSERT INTO student_renewals (
    student_id,
    payment_link_id,
    cycle_number,
    amount,
    currency,
    package_id,
    package_session_count,
    renewal_source,
    created_by
  ) VALUES (
    p_student_id,
    p_payment_link_id,
    v_current_cycle + 1,
    p_amount,
    p_currency,
    p_package_id,
    p_package_session_count,
    p_renewal_source,
    auth.uid()
  ) RETURNING id INTO v_renewal_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'renewal_id', v_renewal_id,
    'new_cycle', v_current_cycle + 1,
    'lifetime_revenue', v_current_lifetime_revenue + p_amount,
    'message', 'Renewal processed successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to process renewal: %', SQLERRM;
END;
$$;

-- Function to get MMR analytics
CREATE OR REPLACE FUNCTION public.get_mmr_analytics(
  p_sales_agent_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_mrr numeric := 0;
  v_new_mrr numeric := 0;
  v_renewal_mrr numeric := 0;
  v_churn_mrr numeric := 0;
  v_net_mrr_growth numeric := 0;
  v_renewal_rate numeric := 0;
  v_filter_condition text := '';
BEGIN
  -- Build filter condition if sales agent specified
  IF p_sales_agent_id IS NOT NULL THEN
    v_filter_condition := ' AND s.assigned_sales_agent_id = ''' || p_sales_agent_id || '''';
  END IF;
  
  -- Calculate total MRR (active subscriptions)
  EXECUTE format(
    'SELECT COALESCE(SUM(pl.amount), 0) FROM payment_links pl 
     JOIN students s ON s.id = ANY(pl.student_ids) 
     WHERE pl.status = ''paid'' AND s.status IN (''paid'', ''active'') %s',
    v_filter_condition
  ) INTO v_total_mrr;
  
  -- Calculate new customer MRR (first cycle)
  EXECUTE format(
    'SELECT COALESCE(SUM(sr.amount), 0) FROM student_renewals sr
     JOIN students s ON s.id = sr.student_id
     WHERE sr.cycle_number = 1 AND sr.created_at >= date_trunc(''month'', CURRENT_DATE) %s',
    v_filter_condition
  ) INTO v_new_mrr;
  
  -- Calculate renewal MRR (cycle > 1)
  EXECUTE format(
    'SELECT COALESCE(SUM(sr.amount), 0) FROM student_renewals sr
     JOIN students s ON s.id = sr.student_id
     WHERE sr.cycle_number > 1 AND sr.created_at >= date_trunc(''month'', CURRENT_DATE) %s',
    v_filter_condition
  ) INTO v_renewal_mrr;
  
  -- Calculate renewal rate
  EXECUTE format(
    'SELECT CASE WHEN COUNT(*) > 0 THEN 
       (COUNT(*) FILTER (WHERE renewal_count > 0)::numeric / COUNT(*)::numeric) * 100 
     ELSE 0 END
     FROM students s WHERE s.status IN (''expired'', ''paid'', ''active'') %s',
    v_filter_condition
  ) INTO v_renewal_rate;
  
  v_net_mrr_growth := v_new_mrr + v_renewal_mrr - v_churn_mrr;
  
  RETURN jsonb_build_object(
    'total_mrr', v_total_mrr,
    'new_customer_mrr', v_new_mrr,
    'renewal_mrr', v_renewal_mrr,
    'churn_mrr', v_churn_mrr,
    'net_mrr_growth', v_net_mrr_growth,
    'renewal_rate', ROUND(v_renewal_rate, 2),
    'calculated_at', now()
  );
END;
$$;

-- Update existing check_subscription_completion to handle renewals
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
  v_subscription_cycle integer;
BEGIN
  -- Count sessions for current cycle (excluding trial sessions)
  SELECT 
    COALESCE(s.package_session_count, 8) as total,
    COUNT(CASE WHEN ses.status = 'completed' AND ses.session_number > 1 THEN 1 END) as completed,
    s.status,
    COALESCE(s.subscription_cycle, 1)
  INTO v_total_sessions, v_completed_sessions, v_student_status, v_subscription_cycle
  FROM students s
  LEFT JOIN session_students ss ON s.id = ss.student_id
  LEFT JOIN sessions ses ON ss.session_id = ses.id
  WHERE s.id = p_student_id
  GROUP BY s.id, s.package_session_count, s.status, s.subscription_cycle;
  
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
    'subscription_cycle', v_subscription_cycle,
    'completion_percentage', 
      CASE WHEN v_total_sessions > 0 
        THEN ROUND((v_completed_sessions::decimal / v_total_sessions::decimal) * 100, 1)
        ELSE 0 
      END,
    'is_renewal_candidate', v_completed_sessions >= (v_total_sessions * 0.8)
  );
END;
$$;