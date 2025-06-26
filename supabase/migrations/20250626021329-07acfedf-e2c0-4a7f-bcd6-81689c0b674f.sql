
-- Enable RLS on invitation_codes table if not already enabled
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous users to read active invitation codes for validation
CREATE POLICY "Allow anonymous users to validate invitation codes" 
ON public.invitation_codes
FOR SELECT 
USING (is_active = true);

-- Create policy to allow authenticated users to view their own created codes
CREATE POLICY "Users can view codes they created" 
ON public.invitation_codes
FOR SELECT 
USING (auth.uid() = created_by);

-- Create policy to allow admins to manage all invitation codes
CREATE POLICY "Admins can manage all invitation codes" 
ON public.invitation_codes
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND status = 'approved'
  )
);
