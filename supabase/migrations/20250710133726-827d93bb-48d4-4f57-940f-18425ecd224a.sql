-- PHASE 2: DATA INTEGRITY PROTECTION (FIXED)
-- Fix dangerous CASCADE deletes and improve data safety

-- 1. Fix dangerous CASCADE delete on students -> family_groups
-- This prevents accidental deletion of students when family group is deleted
ALTER TABLE public.students 
DROP CONSTRAINT IF EXISTS fk_students_family_group,
DROP CONSTRAINT IF EXISTS students_family_group_id_fkey;

-- Add safer constraint - SET NULL instead of CASCADE
ALTER TABLE public.students 
ADD CONSTRAINT students_family_group_id_fkey 
FOREIGN KEY (family_group_id) REFERENCES public.family_groups(id) ON DELETE SET NULL;

-- 2. Review and fix other foreign key constraints for safety
-- Make sure critical reference fields are NOT NULL where they should be
ALTER TABLE public.students 
ALTER COLUMN assigned_sales_agent_id SET NOT NULL;

ALTER TABLE public.family_groups 
ALTER COLUMN assigned_sales_agent_id SET NOT NULL;

-- 3. Create function to validate student IDs in payment_links
CREATE OR REPLACE FUNCTION public.validate_payment_link_students()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  student_id_item UUID;
BEGIN
  -- Check each student ID in the array exists
  FOR student_id_item IN SELECT unnest(NEW.student_ids)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = student_id_item) THEN
      RAISE EXCEPTION 'Invalid student ID % in payment link', student_id_item;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payment_links validation
DROP TRIGGER IF EXISTS validate_payment_link_students_trigger ON public.payment_links;
CREATE TRIGGER validate_payment_link_students_trigger
  BEFORE INSERT OR UPDATE ON public.payment_links
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_link_students();

-- 4. Add data consistency checks for family trial consistency
CREATE OR REPLACE FUNCTION public.validate_family_trial_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  family_trial_date DATE;
  family_trial_time TIME;
BEGIN
  -- If student belongs to a family group, ensure trial date/time match
  IF NEW.family_group_id IS NOT NULL THEN
    SELECT trial_date, trial_time 
    INTO family_trial_date, family_trial_time
    FROM public.family_groups 
    WHERE id = NEW.family_group_id;
    
    -- Update student trial date/time to match family group
    IF family_trial_date IS NOT NULL THEN
      NEW.trial_date := family_trial_date;
    END IF;
    
    IF family_trial_time IS NOT NULL THEN
      NEW.trial_time := family_trial_time;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for family trial consistency
DROP TRIGGER IF EXISTS family_trial_consistency_trigger ON public.students;
CREATE TRIGGER family_trial_consistency_trigger
  BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_family_trial_consistency();

-- 5. Add indexes for foreign key performance
CREATE INDEX IF NOT EXISTS idx_students_family_group_id ON public.students(family_group_id) WHERE family_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_assigned_teacher_id ON public.students(assigned_teacher_id) WHERE assigned_teacher_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_assigned_sales_agent_id ON public.students(assigned_sales_agent_id);
CREATE INDEX IF NOT EXISTS idx_family_groups_assigned_teacher_id ON public.family_groups(assigned_teacher_id) WHERE assigned_teacher_id IS NOT NULL;

-- 6. Log Phase 2 completion
INSERT INTO public.audit_logs (
  action_type, 
  target_type, 
  metadata
) VALUES (
  'data_integrity_patch_applied',
  'database',
  jsonb_build_object(
    'phase', 'phase_2_data_integrity',
    'fixes', jsonb_build_array(
      'dangerous_cascade_deletes_fixed',
      'foreign_key_constraints_improved',
      'data_validation_triggers_added',
      'referential_integrity_enhanced'
    ),
    'timestamp', now()
  )
);