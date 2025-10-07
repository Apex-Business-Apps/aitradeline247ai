-- Fix: Allow NULL stripe_customer_id for free trials
-- The start-trial function creates trial subscriptions without Stripe customers
ALTER TABLE public.subscriptions 
ALTER COLUMN stripe_customer_id DROP NOT NULL;

-- Add a comment explaining this is allowed for trials
COMMENT ON COLUMN public.subscriptions.stripe_customer_id IS 
'Stripe customer ID. NULL for free trial subscriptions before payment setup.';