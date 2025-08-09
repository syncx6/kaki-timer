-- Add daily features to profiles table
ALTER TABLE public.profiles 
ADD COLUMN daily_timer_sessions INTEGER DEFAULT 0,
ADD COLUMN last_daily_reset DATE DEFAULT CURRENT_DATE,
ADD COLUMN daily_gift_opened BOOLEAN DEFAULT false,
ADD COLUMN last_gift_date DATE DEFAULT NULL,
ADD COLUMN login_streak INTEGER DEFAULT 0,
ADD COLUMN last_login_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN longest_streak INTEGER DEFAULT 0;

-- Add PVP stats to profiles for quick access
ALTER TABLE public.profiles 
ADD COLUMN pvp_wins INTEGER DEFAULT 0,
ADD COLUMN pvp_total INTEGER DEFAULT 0,
ADD COLUMN pvp_win_rate DECIMAL(5,2) DEFAULT 0.00;

-- Create daily_gifts table to track gift history
CREATE TABLE IF NOT EXISTS public.daily_gifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    gift_date DATE NOT NULL,
    kaki_amount INTEGER NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, gift_date)
);

-- Enable RLS on daily_gifts
ALTER TABLE public.daily_gifts ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_gifts
CREATE POLICY "Users can view their own gifts" ON public.daily_gifts
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own gifts" ON public.daily_gifts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_gifts_user_date ON public.daily_gifts(user_id, gift_date);
CREATE INDEX IF NOT EXISTS idx_profiles_daily_reset ON public.profiles(last_daily_reset);
CREATE INDEX IF NOT EXISTS idx_profiles_gift_date ON public.profiles(last_gift_date);

-- Function to reset daily counters at midnight
CREATE OR REPLACE FUNCTION reset_daily_counters()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles 
    SET 
        daily_timer_sessions = 0,
        last_daily_reset = CURRENT_DATE,
        daily_gift_opened = false
    WHERE last_daily_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;