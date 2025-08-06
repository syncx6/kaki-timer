-- Create function to increment kaki count
CREATE OR REPLACE FUNCTION public.increment_kaki_count(user_id UUID, count INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles 
  SET kaki_count = COALESCE(kaki_count, 0) + count 
  WHERE profiles.user_id = increment_kaki_count.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;