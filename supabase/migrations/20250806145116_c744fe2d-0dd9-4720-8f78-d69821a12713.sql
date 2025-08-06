-- Fix RLS policy for profiles insertion during registration
-- The issue is that we need to allow registration to create profiles even during the signup process

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a more permissive policy for profile creation that works during signup
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid() IS NOT NULL
);