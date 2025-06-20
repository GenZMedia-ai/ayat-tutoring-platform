
-- Step 1: Database Schema Extensions for Round-Robin and Multi-Student Support

-- Add last_booked_at column to profiles for round-robin tracking
ALTER TABLE public.profiles 
ADD COLUMN last_booked_at TIMESTAMPTZ;

-- Create session_students junction table for proper multi-student linking
CREATE TABLE public.session_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT session_students_session_id_student_id_key UNIQUE (session_id, student_id)
);

-- Enable RLS on session_students table
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
      AND role IN ('admin', 'sales', 'teacher')
      AND status = 'approved'
    )
  );

-- Migrate existing session-student relationships to junction table
INSERT INTO public.session_students (session_id, student_id, created_at)
SELECT id, student_id, created_at 
FROM public.sessions 
WHERE student_id IS NOT NULL;

-- Update sessions table RLS policies to work with junction table
DROP POLICY IF EXISTS "Users can view sessions for their students" ON public.sessions;
DROP POLICY IF EXISTS "Authorized users can manage sessions" ON public.sessions;

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

-- Remove student_id column from sessions table (now using junction table)
ALTER TABLE public.sessions 
DROP COLUMN student_id;
