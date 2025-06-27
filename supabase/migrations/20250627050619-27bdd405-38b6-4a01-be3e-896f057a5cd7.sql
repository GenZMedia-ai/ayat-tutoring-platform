
-- Phase 1: Remove Database Functions
DROP FUNCTION IF EXISTS public.create_sales_followup(DATE, TIME, TEXT, UUID, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.update_sales_followup(UUID, DATE, TIME, TEXT, TEXT);

-- Phase 2: Remove Foreign Key Constraints (if they exist)
ALTER TABLE public.sales_followups DROP CONSTRAINT IF EXISTS sales_followups_student_id_fkey;
ALTER TABLE public.sales_followups DROP CONSTRAINT IF EXISTS sales_followups_family_group_id_fkey;
ALTER TABLE public.sales_followups DROP CONSTRAINT IF EXISTS sales_followups_sales_agent_id_fkey;
ALTER TABLE public.sales_followups DROP CONSTRAINT IF EXISTS sales_followups_created_by_fkey;

-- Phase 3: Remove Check Constraints
ALTER TABLE public.sales_followups DROP CONSTRAINT IF EXISTS followup_target_check;

-- Phase 4: Remove Added Columns
ALTER TABLE public.sales_followups DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.sales_followups DROP COLUMN IF EXISTS family_group_id;
ALTER TABLE public.sales_followups DROP COLUMN IF EXISTS scheduled_time;

-- Phase 5: Verify the table structure is back to original
-- The sales_followups table should now only have:
-- id, student_id, sales_agent_id, scheduled_date, reason, completed, completed_at, outcome, notes, created_at, updated_at
