
-- Phase 1: Database Schema Updates (Fixed)

-- Add last_booked_at column to profiles table for round-robin tracking
ALTER TABLE public.profiles
ADD COLUMN last_booked_at TIMESTAMPTZ;

-- Create session_students junction table for proper multi-student session linking
CREATE TABLE public.session_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT session_students_session_id_student_id_key UNIQUE (session_id, student_id)
);

-- Enable RLS on new table
ALTER TABLE public.session_students ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for session_students
CREATE POLICY "Users can view session_students based on role" 
  ON public.session_students 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sales', 'teacher', 'supervisor')
      AND status = 'approved'
    )
  );

CREATE POLICY "Users can manage session_students based on role" 
  ON public.session_students 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sales')
      AND status = 'approved'
    )
  );

-- Migrate existing session data to new schema
INSERT INTO public.session_students (session_id, student_id, created_at)
SELECT id, student_id, created_at 
FROM public.sessions 
WHERE student_id IS NOT NULL;

-- Drop existing RLS policies that depend on student_id
DROP POLICY IF EXISTS "Users can view sessions for their students" ON public.sessions;
DROP POLICY IF EXISTS "Authorized users can manage sessions" ON public.sessions;

-- Remove the old student_id column from sessions table
ALTER TABLE public.sessions DROP COLUMN student_id;

-- Create new RLS policies for sessions table without student_id dependency
CREATE POLICY "Users can view sessions based on role" 
  ON public.sessions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sales', 'teacher', 'supervisor')
      AND status = 'approved'
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
