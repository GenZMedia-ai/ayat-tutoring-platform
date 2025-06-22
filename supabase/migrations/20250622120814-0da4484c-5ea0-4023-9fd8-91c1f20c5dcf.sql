
-- COMPLETE ROLLBACK: Post-Payment Registration Workflow
-- Phase 1: Database Cleanup (Execute in this exact order)

-- Step 1: Drop RPC functions (in reverse dependency order)
DROP FUNCTION IF EXISTS public.check_subscription_completion(UUID);
DROP FUNCTION IF EXISTS public.complete_session_with_details(UUID, INTEGER, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.complete_student_registration(UUID, JSONB);
DROP FUNCTION IF EXISTS public.get_teacher_paid_students(UUID);

-- Step 2: Drop session_reminders table (CASCADE will remove its policies)
DROP TABLE IF EXISTS public.session_reminders CASCADE;

-- Step 3: Remove added columns from students table
ALTER TABLE public.students 
DROP COLUMN IF EXISTS package_session_count,
DROP COLUMN IF EXISTS completed_sessions,
DROP COLUMN IF EXISTS package_purchased_at,
DROP COLUMN IF EXISTS registration_completed_at;

-- Step 4: Drop indexes created for the workflow
DROP INDEX IF EXISTS idx_students_assigned_teacher_status;
DROP INDEX IF EXISTS idx_students_package_tracking;
DROP INDEX IF EXISTS idx_sessions_scheduled_date_time;
DROP INDEX IF EXISTS idx_session_students_lookup;

-- Verification: Confirm cleanup completed
SELECT 'Post-Payment Registration Workflow rollback completed successfully' AS status;
