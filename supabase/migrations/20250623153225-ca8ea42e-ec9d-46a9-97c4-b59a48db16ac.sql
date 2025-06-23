
-- Add missing columns to students table for individual package tracking
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS package_session_count INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS package_name TEXT,
ADD COLUMN IF NOT EXISTS payment_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_currency TEXT DEFAULT 'USD';

-- Update payment_links table to store package session count if not exists
ALTER TABLE public.payment_links 
ADD COLUMN IF NOT EXISTS package_session_count INTEGER DEFAULT 8;

-- Create index for faster queries on paid students
CREATE INDEX IF NOT EXISTS idx_students_teacher_status ON public.students(assigned_teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_students_family_group ON public.students(family_group_id);

-- Add helpful comments
COMMENT ON COLUMN public.students.package_session_count IS 'Number of sessions purchased by this student';
COMMENT ON COLUMN public.students.package_name IS 'Name of the package purchased';
COMMENT ON COLUMN public.students.payment_amount IS 'Amount paid for this student (in cents)';
COMMENT ON COLUMN public.students.payment_currency IS 'Currency used for payment';
