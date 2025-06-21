
-- Phase 1: Database Schema Enhancement for Family Booking System
-- This creates the foundation for family grouping without breaking existing functionality

-- Create family_groups table to store parent/family information
CREATE TABLE public.family_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unique_id TEXT NOT NULL UNIQUE, -- AYB_2025_FAM_001234 format
  parent_name TEXT NOT NULL,
  phone TEXT NOT NULL, -- WhatsApp number with country code
  country TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('zoom', 'google-meet')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'trial-completed', 'trial-ghosted', 'awaiting-payment', 'paid', 'active', 'expired', 'cancelled', 'dropped')),
  assigned_teacher_id UUID,
  assigned_sales_agent_id UUID NOT NULL,
  assigned_supervisor_id UUID,
  trial_date DATE,
  trial_time TIME,
  teacher_type TEXT NOT NULL CHECK (teacher_type IN ('kids', 'adult', 'mixed', 'expert')),
  student_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add family_group_id to students table (nullable for backward compatibility)
ALTER TABLE public.students ADD COLUMN family_group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_students_family_group ON public.students(family_group_id);
CREATE INDEX idx_family_groups_assigned_sales_agent ON public.family_groups(assigned_sales_agent_id);
CREATE INDEX idx_family_groups_assigned_teacher ON public.family_groups(assigned_teacher_id);
CREATE INDEX idx_family_groups_status ON public.family_groups(status);
CREATE INDEX idx_family_groups_trial_date ON public.family_groups(trial_date);

-- Enable RLS on family_groups table
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for family_groups table
CREATE POLICY "Sales agents can view their assigned family groups" 
  ON public.family_groups 
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

CREATE POLICY "Sales agents can create family groups" 
  ON public.family_groups 
  FOR INSERT 
  WITH CHECK (auth.uid() = assigned_sales_agent_id);

CREATE POLICY "Sales agents can update their assigned family groups" 
  ON public.family_groups 
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

CREATE POLICY "Teachers can view their assigned family groups" 
  ON public.family_groups 
  FOR SELECT 
  USING (auth.uid() = assigned_teacher_id);

-- Create function to generate family unique ID
CREATE OR REPLACE FUNCTION public.generate_family_unique_id()
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
    CAST(SUBSTRING(unique_id FROM 'AYB_' || year_part || '_FAM_(\d+)') AS INTEGER)
  ), 0) + 1 
  INTO sequence_num
  FROM public.family_groups
  WHERE unique_id LIKE 'AYB_' || year_part || '_FAM_%';
  
  new_id := 'AYB_' || year_part || '_FAM_' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN new_id;
END;
$$;

-- Enhanced booking function that supports family groups
CREATE OR REPLACE FUNCTION public.book_family_trial_session(
    p_booking_data jsonb,
    p_selected_date date,
    p_utc_start_time time,
    p_teacher_type text,
    p_teacher_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id uuid;
    v_user_role text;
    v_teacher_name text;
    v_session_id uuid;
    v_family_group_id uuid;
    v_family_unique_id text;
    v_student_record jsonb;
    v_student_names text := '';
    v_student_count integer := 0;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- Check authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Check authorization (sales agents only)
    SELECT role INTO v_user_role 
    FROM public.profiles 
    WHERE id = v_user_id AND status = 'approved';
    
    IF v_user_role IS NULL OR v_user_role NOT IN ('sales', 'admin') THEN
        RAISE EXCEPTION 'Access denied - sales agent role required';
    END IF;
    
    -- Get teacher name
    SELECT full_name INTO v_teacher_name
    FROM public.profiles
    WHERE id = p_teacher_id;
    
    IF v_teacher_name IS NULL THEN
        RAISE EXCEPTION 'Teacher not found';
    END IF;
    
    -- Verify slot is still available
    IF NOT EXISTS (
        SELECT 1 FROM public.teacher_availability
        WHERE teacher_id = p_teacher_id
        AND date = p_selected_date
        AND time_slot = p_utc_start_time
        AND is_available = true
        AND is_booked = false
    ) THEN
        RAISE EXCEPTION 'Time slot no longer available';
    END IF;
    
    -- Generate family unique ID
    v_family_unique_id := public.generate_family_unique_id();
    
    -- Create family group
    INSERT INTO public.family_groups (
        unique_id,
        parent_name,
        phone,
        country,
        platform,
        teacher_type,
        trial_date,
        trial_time,
        assigned_teacher_id,
        assigned_sales_agent_id,
        notes,
        status,
        student_count
    ) VALUES (
        v_family_unique_id,
        p_booking_data->>'parentName',
        p_booking_data->>'phone',
        p_booking_data->>'country',
        p_booking_data->>'platform',
        p_teacher_type,
        p_selected_date,
        p_utc_start_time,
        p_teacher_id,
        v_user_id,
        COALESCE(p_booking_data->>'notes', ''),
        'pending',
        jsonb_array_length(p_booking_data->'students')
    ) RETURNING id INTO v_family_group_id;
    
    -- Create session
    INSERT INTO public.sessions (
        scheduled_date,
        scheduled_time,
        status,
        notes
    ) VALUES (
        p_selected_date,
        p_utc_start_time,
        'scheduled',
        COALESCE(p_booking_data->>'notes', '')
    ) RETURNING id INTO v_session_id;
    
    -- Create individual student records linked to family
    FOR v_student_record IN 
        SELECT value FROM jsonb_array_elements(p_booking_data->'students')
    LOOP
        v_student_count := v_student_count + 1;
        
        INSERT INTO public.students (
            unique_id,
            name,
            age,
            phone,
            country,
            platform,
            teacher_type,
            trial_date,
            trial_time,
            assigned_teacher_id,
            assigned_sales_agent_id,
            parent_name,
            notes,
            status,
            family_group_id
        ) VALUES (
            v_family_unique_id || '_S' || v_student_count,
            v_student_record->>'name',
            (v_student_record->>'age')::integer,
            p_booking_data->>'phone',
            p_booking_data->>'country',
            p_booking_data->>'platform',
            p_teacher_type,
            p_selected_date,
            p_utc_start_time,
            p_teacher_id,
            v_user_id,
            p_booking_data->>'parentName',
            COALESCE(p_booking_data->>'notes', ''),
            'pending',
            v_family_group_id
        );
        
        -- Build response strings
        IF v_student_names = '' THEN
            v_student_names := v_student_record->>'name';
        ELSE
            v_student_names := v_student_names || ', ' || (v_student_record->>'name');
        END IF;
    END LOOP;
    
    -- Link family to session (we'll use the first student for session linkage)
    INSERT INTO public.session_students (session_id, student_id)
    SELECT v_session_id, id FROM public.students 
    WHERE family_group_id = v_family_group_id 
    LIMIT 1;
    
    -- Mark slot as booked
    UPDATE public.teacher_availability 
    SET is_booked = true, updated_at = NOW()
    WHERE teacher_id = p_teacher_id 
    AND date = p_selected_date 
    AND time_slot = p_utc_start_time;
    
    -- Update teacher's last booked timestamp
    UPDATE public.profiles 
    SET last_booked_at = NOW() 
    WHERE id = p_teacher_id;
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'teacher_name', v_teacher_name,
        'teacher_id', p_teacher_id::text,
        'session_id', v_session_id::text,
        'family_group_id', v_family_group_id::text,
        'family_unique_id', v_family_unique_id,
        'student_names', v_student_names,
        'student_count', v_student_count,
        'booked_time_slot', p_utc_start_time::text
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Family booking failed: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.book_family_trial_session TO authenticated;
