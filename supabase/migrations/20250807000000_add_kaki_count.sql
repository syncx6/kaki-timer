-- Add kaki_count column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kaki_count INTEGER DEFAULT 0;

-- Update existing profiles to have 0 kaki_count if they don't have it
UPDATE public.profiles 
SET kaki_count = 0 
WHERE kaki_count IS NULL; 