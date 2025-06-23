
-- Phase 1: Critical Database Fixes (with existence checks)
-- Fix 1: Add RLS policies for teachers to update family groups and students

-- Only create policies if they don't exist
DO $$ 
BEGIN
  -- Allow teachers to update family groups they're assigned to
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'family_groups' 
    AND policyname = 'Teachers can update their assigned family groups'
  ) THEN
    CREATE POLICY "Teachers can update their assigned family groups"
    ON public.family_groups 
    FOR UPDATE 
    USING (auth.uid() = assigned_teacher_id);
  END IF;

  -- Allow teachers to update students they're assigned to  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'students' 
    AND policyname = 'Teachers can update their assigned students'
  ) THEN
    CREATE POLICY "Teachers can update their assigned students"
    ON public.students 
    FOR UPDATE 
    USING (auth.uid() = assigned_teacher_id);
  END IF;

  -- Teachers can view their assigned family groups (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'family_groups' 
    AND policyname = 'Teachers can view their assigned family groups'
  ) THEN
    CREATE POLICY "Teachers can view their assigned family groups"
    ON public.family_groups 
    FOR SELECT 
    USING (auth.uid() = assigned_teacher_id);
  END IF;

  -- Teachers can view their assigned students (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'students' 
    AND policyname = 'Teachers can view their assigned students'
  ) THEN
    CREATE POLICY "Teachers can view their assigned students" 
    ON public.students 
    FOR SELECT 
    USING (auth.uid() = assigned_teacher_id);
  END IF;
END $$;
