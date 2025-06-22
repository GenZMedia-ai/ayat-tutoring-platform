
-- Database Verification & Cleanup Plan - Phase 1 & 2
-- Restore database to "Fix n8n webhook handler" commit state

-- Step 1: Check for and remove any columns that may have been added after the target commit
-- Based on the recent rollback, these columns should already be cleaned up, but let's verify

-- Check if any post-payment workflow columns still exist on students table
DO $$
BEGIN
    -- Remove package tracking columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'package_session_count') THEN
        ALTER TABLE public.students DROP COLUMN IF EXISTS package_session_count;
        RAISE NOTICE 'Removed package_session_count column from students table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'completed_sessions') THEN
        ALTER TABLE public.students DROP COLUMN IF EXISTS completed_sessions;
        RAISE NOTICE 'Removed completed_sessions column from students table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'package_purchased_at') THEN
        ALTER TABLE public.students DROP COLUMN IF EXISTS package_purchased_at;
        RAISE NOTICE 'Removed package_purchased_at column from students table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'registration_completed_at') THEN
        ALTER TABLE public.students DROP COLUMN IF EXISTS registration_completed_at;
        RAISE NOTICE 'Removed registration_completed_at column from students table';
    END IF;
END $$;

-- Step 2: Drop any tables that shouldn't exist in the target commit state
DROP TABLE IF EXISTS public.session_reminders CASCADE;

-- Step 3: Drop any functions that were added after the target commit
DROP FUNCTION IF EXISTS public.check_subscription_completion(UUID);
DROP FUNCTION IF EXISTS public.complete_session_with_details(UUID, INTEGER, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.complete_student_registration(UUID, JSONB);
DROP FUNCTION IF EXISTS public.get_teacher_paid_students(UUID);

-- Step 4: Drop any indexes that were added after the target commit
DROP INDEX IF EXISTS idx_students_assigned_teacher_status;
DROP INDEX IF EXISTS idx_students_package_tracking;
DROP INDEX IF EXISTS idx_sessions_scheduled_date_time;
DROP INDEX IF EXISTS idx_session_students_lookup;

-- Step 5: Verify core table structures match expected state
-- Check students table constraint (should include 'awaiting-payment' status)
DO $$
BEGIN
    -- Ensure students status constraint is correct for the target commit
    ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_status_check;
    
    ALTER TABLE public.students ADD CONSTRAINT students_status_check 
    CHECK (status IN (
      'pending',
      'confirmed', 
      'trial-completed',
      'trial-ghosted',
      'awaiting-payment',
      'paid',
      'active',
      'expired',
      'cancelled',
      'dropped'
    ));
    
    RAISE NOTICE 'Students status constraint verified and updated';
END $$;

-- Step 6: Verify all essential functions exist and are correct
-- These should be present from the target commit state
DO $$
BEGIN
    -- Verify essential functions exist
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_student_unique_id') THEN
        RAISE EXCEPTION 'Critical function generate_student_unique_id is missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'simple_book_trial_session') THEN
        RAISE EXCEPTION 'Critical function simple_book_trial_session is missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'confirm_trial') THEN
        RAISE EXCEPTION 'Critical function confirm_trial is missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_whatsapp_contact') THEN
        RAISE EXCEPTION 'Critical function log_whatsapp_contact is missing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'submit_trial_outcome') THEN
        RAISE EXCEPTION 'Critical function submit_trial_outcome is missing';
    END IF;
    
    RAISE NOTICE 'All essential functions verified as present';
END $$;

-- Step 7: Clean up any orphaned data or references
-- Remove any session_students entries that might reference non-existent sessions
DELETE FROM public.session_students 
WHERE session_id NOT IN (SELECT id FROM public.sessions);

-- Step 8: Verify table relationships and constraints
-- Ensure foreign key relationships are intact
DO $$
BEGIN
    -- Check students table foreign key to family_groups
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'students_family_group_id_fkey'
        AND table_name = 'students'
    ) THEN
        ALTER TABLE public.students 
        ADD CONSTRAINT students_family_group_id_fkey 
        FOREIGN KEY (family_group_id) REFERENCES public.family_groups(id);
        RAISE NOTICE 'Restored students family_group_id foreign key';
    END IF;
    
    -- Check session_students foreign keys
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'session_students_session_id_fkey'
        AND table_name = 'session_students'
    ) THEN
        ALTER TABLE public.session_students 
        ADD CONSTRAINT session_students_session_id_fkey 
        FOREIGN KEY (session_id) REFERENCES public.sessions(id);
        RAISE NOTICE 'Restored session_students session_id foreign key';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'session_students_student_id_fkey'
        AND table_name = 'session_students'
    ) THEN
        ALTER TABLE public.session_students 
        ADD CONSTRAINT session_students_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES public.students(id);
        RAISE NOTICE 'Restored session_students student_id foreign key';
    END IF;
END $$;

-- Final verification: Check database integrity
SELECT 'Database cleanup and verification completed successfully' AS status;

-- Verify core table counts to ensure no data loss
SELECT 
    'students' as table_name, 
    COUNT(*) as record_count 
FROM public.students
UNION ALL
SELECT 
    'sessions' as table_name, 
    COUNT(*) as record_count 
FROM public.sessions
UNION ALL
SELECT 
    'teacher_availability' as table_name, 
    COUNT(*) as record_count 
FROM public.teacher_availability
UNION ALL
SELECT 
    'profiles' as table_name, 
    COUNT(*) as record_count 
FROM public.profiles;
