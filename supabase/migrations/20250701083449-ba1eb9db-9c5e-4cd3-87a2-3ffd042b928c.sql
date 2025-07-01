
-- Add stripe_checkout_url column to payment_links table to store the complete working URL
ALTER TABLE public.payment_links 
ADD COLUMN stripe_checkout_url TEXT;

-- Add a comment to document the purpose of this column
COMMENT ON COLUMN public.payment_links.stripe_checkout_url IS 'Complete Stripe checkout URL returned by Stripe API (session.url)';
