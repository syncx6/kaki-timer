-- Create pvp_challenges table
CREATE TABLE IF NOT EXISTS public.pvp_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    player_username TEXT NOT NULL,
    opponent_id TEXT NOT NULL, -- Can be UUID for real players or string for CPU
    opponent_username TEXT NOT NULL,
    player_clicks INTEGER DEFAULT 0,
    opponent_clicks INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    winner_id TEXT -- Can be UUID for real players or string for CPU
);

-- Enable RLS
ALTER TABLE public.pvp_challenges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own PVP challenges" ON public.pvp_challenges
    FOR SELECT USING (auth.uid()::text = player_id::text);

CREATE POLICY "Users can insert their own PVP challenges" ON public.pvp_challenges
    FOR INSERT WITH CHECK (auth.uid()::text = player_id::text);

CREATE POLICY "Users can update their own PVP challenges" ON public.pvp_challenges
    FOR UPDATE USING (auth.uid()::text = player_id::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pvp_challenges_player_id ON public.pvp_challenges(player_id);
CREATE INDEX IF NOT EXISTS idx_pvp_challenges_status ON public.pvp_challenges(status);
CREATE INDEX IF NOT EXISTS idx_pvp_challenges_created_at ON public.pvp_challenges(created_at); 