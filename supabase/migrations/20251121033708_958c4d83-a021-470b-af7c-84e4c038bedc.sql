-- Add policy to allow users to insert themselves into user_roles (for joining companies)
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);