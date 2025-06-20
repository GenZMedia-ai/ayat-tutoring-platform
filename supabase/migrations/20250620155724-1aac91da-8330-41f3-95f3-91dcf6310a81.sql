
-- Complete Database Rollback Plan
-- This will restore the schema to its state before the recent migration

-- Step 1: Add student_id column back to sessions table
ALTER TABLE public.sessions 
ADD COLUMN student_id UUID REFERENCES public.students(id) ON DELETE CASCADE;

-- Step 2: Drop the session_students table and its policies
DROP POLICY IF EXISTS "Users can view session_students based on role" ON public.session_students;
DROP POLICY IF EXISTS "Users can manage session_students based on role" ON public.session_students;
DROP TABLE IF EXISTS public.session_students;

-- Step 3: Remove last_booked_at column from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS last_booked_at;

-- Step 4: Drop current generic RLS policies for sessions
DROP POLICY IF EXISTS "Users can view sessions based on role" ON public.sessions;
DROP POLICY IF EXISTS "Authorized users can manage sessions" ON public.sessions;

-- Step 5: Restore original RLS policies for sessions table
CREATE POLICY "Users can view sessions for their students" 
  ON public.sessions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.students 
      WHERE id = student_id 
      AND (
        assigned_teacher_id = auth.uid() 
        OR assigned_sales_agent_id = auth.uid() 
        OR assigned_supervisor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role = 'admin' 
          AND status = 'approved'
        )
      )
    )
  );

CREATE POLICY "Authorized users can manage sessions" 
  ON public.sessions 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sales', 'teacher')
      AND status = 'approved'
    )
  );

-- Step 6: Make student_id NOT NULL (since it was required in the original schema)
-- We'll do this after the policies are in place
ALTER TABLE public.sessions 
ALTER COLUMN student_id SET NOT NULL;
