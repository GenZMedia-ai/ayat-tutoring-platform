
-- Phase 2A: Enhanced Payment Structure Database Schema
-- Supports multi-package family payments with individual package selections

-- 1. Create family_package_selections table to track individual package choices
CREATE TABLE public.family_package_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
  custom_price INTEGER, -- Custom negotiated price (overrides package price)
  currency TEXT NOT NULL DEFAULT 'USD',
  notes TEXT, -- Sales agent notes about the selection
  selected_by UUID NOT NULL REFERENCES auth.users(id), -- Sales agent who made selection
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT family_package_selections_student_unique UNIQUE (student_id),
  CONSTRAINT family_package_selections_custom_price_positive CHECK (custom_price IS NULL OR custom_price > 0),
  CONSTRAINT family_package_selections_currency_format CHECK (currency ~ '^[A-Z]{3}$')
);

-- 2. Add indexes for performance
CREATE INDEX idx_family_package_selections_family_group ON public.family_package_selections(family_group_id);
CREATE INDEX idx_family_package_selections_student ON public.family_package_selections(student_id);
CREATE INDEX idx_family_package_selections_package ON public.family_package_selections(package_id);
CREATE INDEX idx_family_package_selections_created_at ON public.family_package_selections(created_at);

-- 3. Enhance payment_links table to support multi-package family payments
ALTER TABLE public.payment_links 
ADD COLUMN payment_type TEXT DEFAULT 'single_student' CHECK (payment_type IN ('single_student', 'family_group')),
ADD COLUMN family_group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE,
ADD COLUMN package_selections JSONB, -- Stores complete package selection data for robust webhook processing
ADD COLUMN total_amount INTEGER, -- Calculated total (sum of all individual packages)
ADD COLUMN individual_amounts JSONB; -- Breakdown of amounts per student for transparency

-- 4. Add indexes for new payment_links columns
CREATE INDEX idx_payment_links_payment_type ON public.payment_links(payment_type);
CREATE INDEX idx_payment_links_family_group ON public.payment_links(family_group_id);
CREATE INDEX idx_payment_links_total_amount ON public.payment_links(total_amount);

-- 5. Create function to validate family package selections completeness
CREATE OR REPLACE FUNCTION public.validate_family_package_selections(p_family_group_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_students INTEGER;
  v_selected_students INTEGER;
  v_currency_consistency BOOLEAN;
  v_currencies TEXT[];
BEGIN
  -- Count total students in family
  SELECT COUNT(*) INTO v_total_students
  FROM students 
  WHERE family_group_id = p_family_group_id;
  
  -- Count students with package selections
  SELECT COUNT(*) INTO v_selected_students
  FROM family_package_selections
  WHERE family_group_id = p_family_group_id;
  
  -- Check currency consistency
  SELECT ARRAY_AGG(DISTINCT currency) INTO v_currencies
  FROM family_package_selections
  WHERE family_group_id = p_family_group_id;
  
  v_currency_consistency := (array_length(v_currencies, 1) <= 1);
  
  RETURN jsonb_build_object(
    'complete', v_total_students = v_selected_students AND v_total_students > 0,
    'total_students', v_total_students,
    'selected_students', v_selected_students,
    'currency_consistent', v_currency_consistency,
    'currencies', v_currencies,
    'missing_selections', v_total_students - v_selected_students
  );
END;
$$;

-- 6. Create function to calculate family payment total
CREATE OR REPLACE FUNCTION public.calculate_family_payment_total(p_family_group_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_amount INTEGER := 0;
  v_currency TEXT;
  v_selections JSONB := '[]'::jsonb;
  v_individual_amounts JSONB := '{}'::jsonb;
  v_selection_record RECORD;
BEGIN
  -- Get currency (should be consistent by this point)
  SELECT DISTINCT currency INTO v_currency
  FROM family_package_selections
  WHERE family_group_id = p_family_group_id
  LIMIT 1;
  
  -- Calculate total and build selection details
  FOR v_selection_record IN
    SELECT 
      fps.student_id,
      s.name as student_name,
      fps.package_id,
      p.name as package_name,
      p.session_count,
      COALESCE(fps.custom_price, p.price) as final_price,
      fps.currency
    FROM family_package_selections fps
    JOIN students s ON fps.student_id = s.id
    JOIN packages p ON fps.package_id = p.id
    WHERE fps.family_group_id = p_family_group_id
  LOOP
    v_total_amount := v_total_amount + v_selection_record.final_price;
    
    -- Build detailed selection data for webhook processing
    v_selections := v_selections || jsonb_build_object(
      'student_id', v_selection_record.student_id,
      'student_name', v_selection_record.student_name,
      'package_id', v_selection_record.package_id,
      'package_name', v_selection_record.package_name,
      'session_count', v_selection_record.session_count,
      'price', v_selection_record.final_price,
      'currency', v_selection_record.currency
    );
    
    -- Build individual amounts breakdown
    v_individual_amounts := v_individual_amounts || jsonb_build_object(
      v_selection_record.student_id::text, 
      v_selection_record.final_price
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'total_amount', v_total_amount,
    'currency', v_currency,
    'package_selections', v_selections,
    'individual_amounts', v_individual_amounts,
    'student_count', jsonb_array_length(v_selections)
  );
END;
$$;

-- 7. Create function to manage family package selections
CREATE OR REPLACE FUNCTION public.upsert_family_package_selection(
  p_family_group_id UUID,
  p_student_id UUID,
  p_package_id UUID,
  p_custom_price INTEGER DEFAULT NULL,
  p_currency TEXT DEFAULT 'USD',
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_selection_id UUID;
BEGIN
  -- Authentication and authorization
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  SELECT role INTO v_user_role 
  FROM public.profiles 
  WHERE id = v_user_id AND status = 'approved';
  
  IF v_user_role NOT IN ('sales', 'admin') THEN
    RAISE EXCEPTION 'Only sales agents can manage package selections';
  END IF;
  
  -- Validate student belongs to family
  IF NOT EXISTS (
    SELECT 1 FROM students 
    WHERE id = p_student_id AND family_group_id = p_family_group_id
  ) THEN
    RAISE EXCEPTION 'Student does not belong to specified family group';
  END IF;
  
  -- Upsert package selection
  INSERT INTO public.family_package_selections (
    family_group_id,
    student_id,
    package_id,
    custom_price,
    currency,
    notes,
    selected_by
  ) VALUES (
    p_family_group_id,
    p_student_id,
    p_package_id,
    p_custom_price,
    p_currency,
    p_notes,
    v_user_id
  )
  ON CONFLICT (student_id) 
  DO UPDATE SET
    package_id = EXCLUDED.package_id,
    custom_price = EXCLUDED.custom_price,
    currency = EXCLUDED.currency,
    notes = EXCLUDED.notes,
    selected_by = EXCLUDED.selected_by,
    updated_at = now()
  RETURNING id INTO v_selection_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'selection_id', v_selection_id,
    'message', 'Package selection updated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update package selection: %', SQLERRM;
END;
$$;

-- 8. Enable Row Level Security for new table
ALTER TABLE public.family_package_selections ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for family_package_selections
CREATE POLICY "view_own_family_package_selections" ON public.family_package_selections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN family_groups fg ON s.family_group_id = fg.id
    WHERE s.id = family_package_selections.student_id
    AND (fg.assigned_sales_agent_id = auth.uid() OR fg.assigned_teacher_id = auth.uid())
  )
  OR 
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'supervisor')
  )
);

CREATE POLICY "manage_own_family_package_selections" ON public.family_package_selections
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN family_groups fg ON s.family_group_id = fg.id
    WHERE s.id = family_package_selections.student_id
    AND fg.assigned_sales_agent_id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 10. Grant necessary permissions
GRANT ALL ON public.family_package_selections TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_family_package_selections TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_family_payment_total TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_family_package_selection TO authenticated;

-- 11. Add helpful comments
COMMENT ON TABLE public.family_package_selections IS 'Stores individual package selections for family group members';
COMMENT ON COLUMN public.family_package_selections.custom_price IS 'Custom negotiated price overriding package default price';
COMMENT ON COLUMN public.payment_links.package_selections IS 'Complete package selection data for robust webhook processing';
COMMENT ON COLUMN public.payment_links.payment_type IS 'Distinguishes between single student and family group payments';
