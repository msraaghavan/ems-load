-- Add role column to invite_codes table
ALTER TABLE public.invite_codes
ADD COLUMN role app_role NOT NULL DEFAULT 'employee';