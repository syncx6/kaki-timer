-- Rename daily_kaki_earned to daily_timer_sessions
ALTER TABLE public.profiles 
RENAME COLUMN daily_kaki_earned TO daily_timer_sessions;