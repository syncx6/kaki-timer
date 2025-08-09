-- Add online presence fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_online BOOLEAN DEFAULT false,
ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for better performance on online status queries
CREATE INDEX idx_profiles_online_status ON public.profiles(is_online, last_seen);

-- Update existing users to be offline by default
UPDATE public.profiles SET is_online = false, last_seen = now();