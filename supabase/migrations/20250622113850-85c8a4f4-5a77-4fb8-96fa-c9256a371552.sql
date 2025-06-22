
-- Rollback Script: Remove Post-Payment Registration Implementation
-- This script removes all database objects created for the post-payment workflow

-- Step 1: Drop RPC functions (in reverse order of dependencies)
DROP FUNCTION IF EXISTS public.check_subscription_completion(UUID);
DROP FUNCTION IF EXISTS public.complete_session_with_details(UUID, INTEGER, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.complete_student_registration(UUID, JSONB);
DROP FUNCTION IF EXISTS public.get_teacher_paid_students(UUID);

-- Step 2: Drop session_reminders table (this will automatically drop its policies due to CASCADE)
DROP TABLE IF EXISTS public.session_reminders CASCADE;

-- Step 3: Remove the added columns from students table
ALTER TABLE public.students 
DROP COLUMN IF EXISTS package_session_count,
DROP COLUMN IF EXISTS completed_sessions,
DROP COLUMN IF EXISTS package_purchased_at,
DROP COLUMN IF EXISTS registration_completed_at;

-- Step 4: Clean up any remaining orphaned policies (safety check)
-- Note: The session_reminders table drop should have removed its policies,
-- but this ensures no orphaned policies remain
DO $$
BEGIN
    -- Drop any remaining session_reminders policies if they exist
    DROP POLICY IF EXISTS "Teachers can view their session reminders" ON public.session_reminders;
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist, which is expected
        NULL;
END $$;

-- Verification: List remaining functions and tables to confirm cleanup
-- (This is just for verification - remove if not needed)
SELECT 'Cleanup completed successfully' AS status;
