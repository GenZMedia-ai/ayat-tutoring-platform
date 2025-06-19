
-- Create students table for booking management
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unique_id TEXT NOT NULL UNIQUE, -- AYB_2025_001234 format
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone TEXT NOT NULL, -- WhatsApp number with country code
  country TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('zoom', 'google-meet')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'trial-completed', 'trial-ghosted', 'paid', 'active', 'expired', 'cancelled', 'dropped')),
  parent_name TEXT, -- For multi-student bookings
  assigned_teacher_id UUID,
  assigned_sales_agent_id UUID NOT NULL,
  assigned_supervisor_id UUID,
  trial_date DATE,
  trial_time TIME,
  teacher_type TEXT NOT NULL CHECK (teacher_type IN ('kids', 'adult', 'mixed', 'expert')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sessions table for trial session management
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL DEFAULT 1,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  actual_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  reschedule_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for students table
CREATE POLICY "Sales agents can view their assigned students" 
  ON public.students 
  FOR SELECT 
  USING (
    auth.uid() = assigned_sales_agent_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'supervisor')
      AND status = 'approved'
    )
  );

CREATE POLICY "Sales agents can create students" 
  ON public.students 
  FOR INSERT 
  WITH CHECK (auth.uid() = assigned_sales_agent_id);

CREATE POLICY "Sales agents can update their assigned students" 
  ON public.students 
  FOR UPDATE 
  USING (
    auth.uid() = assigned_sales_agent_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'supervisor')
      AND status = 'approved'
    )
  );

CREATE POLICY "Teachers can view their assigned students" 
  ON public.students 
  FOR SELECT 
  USING (auth.uid() = assigned_teacher_id);

-- RLS policies for sessions table
CREATE POLICY "Users can view sessions for their students" 
  ON public.sessions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.students 
      WHERE id = student_id 
      AND (
        assigned_sales_agent_id = auth.uid() OR 
        assigned_teacher_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'supervisor')
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
      SELECT 1 FROM public.students 
      WHERE id = student_id 
      AND (
        assigned_sales_agent_id = auth.uid() OR 
        assigned_teacher_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'supervisor')
          AND status = 'approved'
        )
      )
    )
  );

-- Create function for round-robin teacher assignment
CREATE OR REPLACE FUNCTION public.assign_teacher_round_robin(
  teacher_type_param TEXT,
  trial_date_param DATE,
  trial_time_param TIME
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  selected_teacher_id UUID;
BEGIN
  -- Find available teachers of the specified type for the given date and time
  SELECT ta.teacher_id INTO selected_teacher_id
  FROM public.teacher_availability ta
  JOIN public.profiles p ON p.id = ta.teacher_id
  WHERE ta.date = trial_date_param
    AND ta.time_slot = trial_time_param
    AND ta.is_available = true
    AND ta.is_booked = false
    AND p.teacher_type = teacher_type_param
    AND p.status = 'approved'
    AND p.role = 'teacher'
  ORDER BY (
    SELECT COUNT(*) 
    FROM public.students s 
    WHERE s.assigned_teacher_id = ta.teacher_id 
    AND s.created_at >= CURRENT_DATE - INTERVAL '30 days'
  ) ASC, -- Least assigned teacher first (round-robin)
  RANDOM() -- Random tie-breaker
  LIMIT 1;
  
  RETURN selected_teacher_id;
END;
$$;

-- Create function to generate unique student ID
CREATE OR REPLACE FUNCTION public.generate_student_unique_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id TEXT;
  year_part TEXT;
  sequence_num INTEGER;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(unique_id FROM 'AYB_' || year_part || '_(\d+)') AS INTEGER)
  ), 0) + 1 
  INTO sequence_num
  FROM public.students
  WHERE unique_id LIKE 'AYB_' || year_part || '_%';
  
  new_id := 'AYB_' || year_part || '_' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN new_id;
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_students_assigned_sales_agent ON public.students(assigned_sales_agent_id);
CREATE INDEX idx_students_assigned_teacher ON public.students(assigned_teacher_id);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_students_trial_date ON public.students(trial_date);
CREATE INDEX idx_sessions_student_id ON public.sessions(student_id);
CREATE INDEX idx_sessions_scheduled_date ON public.sessions(scheduled_date);
