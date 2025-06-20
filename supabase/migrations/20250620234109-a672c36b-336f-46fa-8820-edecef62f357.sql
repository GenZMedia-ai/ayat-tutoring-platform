
-- Add policy to allow authenticated users to view approved teacher profiles
CREATE POLICY "Authenticated users can view approved teacher profiles"
ON public.profiles 
FOR SELECT 
USING (
  role = 'teacher' 
  AND status = 'approved'
);
