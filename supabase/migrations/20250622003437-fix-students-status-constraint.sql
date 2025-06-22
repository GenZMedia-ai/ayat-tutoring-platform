

-- Fix students status constraint to include 'awaiting-payment'
-- This resolves the payment link creation error

-- Drop the existing check constraint
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_status_check;

-- Add the updated constraint with 'awaiting-payment' included
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

-- Update the TypeScript types comment for reference
COMMENT ON CONSTRAINT students_status_check ON public.students IS 
'Valid student statuses: pending, confirmed, trial-completed, trial-ghosted, awaiting-payment, paid, active, expired, cancelled, dropped';

