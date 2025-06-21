
-- Add reschedule tracking fields to sessions table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS original_date date,
ADD COLUMN IF NOT EXISTS original_time time without time zone;

-- Update existing sessions to have original date/time if not set
UPDATE public.sessions 
SET original_date = scheduled_date, 
    original_time = scheduled_time 
WHERE original_date IS NULL OR original_time IS NULL;

-- Create index for better performance on reschedule queries
CREATE INDEX IF NOT EXISTS idx_sessions_reschedule_count ON public.sessions(reschedule_count);
CREATE INDEX IF NOT EXISTS idx_sessions_original_datetime ON public.sessions(original_date, original_time);
