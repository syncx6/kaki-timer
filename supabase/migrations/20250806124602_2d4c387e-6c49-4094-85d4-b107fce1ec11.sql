-- Fix RLS policy for profiles table and add kaki_count column
-- Drop existing restrictive policy and create proper ones
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create proper insert policy that allows users to create their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add kaki_count column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kaki_count integer DEFAULT 0;

-- Add kaki_earned column to timer_sessions table to track kakis earned per session
ALTER TABLE public.timer_sessions 
ADD COLUMN IF NOT EXISTS kaki_earned integer DEFAULT 0;