
-- First, let's add RLS policies for the teacher_availability table
ALTER TABLE public.teacher_availability ENABLE ROW LEVEL SECURITY;

-- Allow teachers to view their own availability
CREATE POLICY "Teachers can view their own availability" 
  ON public.teacher_availability 
  FOR SELECT 
  USING (auth.uid() = teacher_id);

-- Allow teachers to insert their own availability
CREATE POLICY "Teachers can create their own availability" 
  ON public.teacher_availability 
  FOR INSERT 
  WITH CHECK (auth.uid() = teacher_id);

-- Allow teachers to update their own availability
CREATE POLICY "Teachers can update their own availability" 
  ON public.teacher_availability 
  FOR UPDATE 
  USING (auth.uid() = teacher_id);

-- Allow teachers to delete their own availability
CREATE POLICY "Teachers can delete their own availability" 
  ON public.teacher_availability 
  FOR DELETE 
  USING (auth.uid() = teacher_id);

-- Allow admin and supervisor roles to view all availability
CREATE POLICY "Admin and supervisors can view all availability" 
  ON public.teacher_availability 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'supervisor')
      AND status = 'approved'
    )
  );
