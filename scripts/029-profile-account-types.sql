-- Add account type and billing fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'individual' CHECK (account_type IN ('individual', 'corporate'));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_name text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tax_id text; -- TRN, VAT, EIN, etc.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS billing_address jsonb; -- { street, city, state, postal_code, country }

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS billing_email text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text;
