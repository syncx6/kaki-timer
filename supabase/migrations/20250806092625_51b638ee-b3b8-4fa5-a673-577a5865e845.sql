-- Add username column to existing profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'username') THEN
        ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
    END IF;
END $$;

-- Create timer sessions table
CREATE TABLE public.timer_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  earned_money NUMERIC NOT NULL,
  salary NUMERIC NOT NULL,
  work_hours NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timer_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for timer sessions
CREATE POLICY "Users can view their own timer sessions" 
ON public.timer_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timer sessions" 
ON public.timer_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timer sessions" 
ON public.timer_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timer sessions" 
ON public.timer_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policy for viewing all sessions (for leaderboard)
CREATE POLICY "All authenticated users can view all sessions for leaderboard" 
ON public.timer_sessions 
FOR SELECT 
TO authenticated
USING (true);

-- Create index for better performance
CREATE INDEX idx_timer_sessions_user_id ON public.timer_sessions(user_id);
CREATE INDEX idx_timer_sessions_duration ON public.timer_sessions(duration DESC);
CREATE INDEX idx_timer_sessions_created_at ON public.timer_sessions(created_at DESC);