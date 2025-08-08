-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('timer', 'pvp', 'social', 'special')),
    requirement_type TEXT NOT NULL CHECK (requirement_type IN ('sessions', 'time', 'kaki', 'wins', 'clicks')),
    requirement_value INTEGER NOT NULL,
    reward_kaki INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for achievements
CREATE POLICY "Anyone can view achievements" ON public.achievements
    FOR SELECT USING (true);

-- Create policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own achievements" ON public.user_achievements
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);

-- Insert default achievements
INSERT INTO public.achievements (title, description, icon, category, requirement_type, requirement_value, reward_kaki) VALUES
('Első Kakilás', 'Végezz el az első időmérő munkamenetet', '🚽', 'timer', 'sessions', 1, 5),
('Kakilás Mester', 'Végezz el 10 időmérő munkamenetet', '👑', 'timer', 'sessions', 10, 20),
('Idő Túra', 'Tölts el összesen 1 órát kakilással', '⏰', 'timer', 'time', 3600, 50),
('Kaki Gyűjtő', 'Gyűjts össze 100 kakit', '💩', 'timer', 'kaki', 100, 100),
('PVP Újonc', 'Játsz az első PVP meccsed', '⚔️', 'pvp', 'wins', 1, 10),
('PVP Harcos', 'Nyerj 10 PVP meccset', '🏆', 'pvp', 'wins', 10, 50),
('Kattintás Mester', 'Érj el 100 kattintást egy meccsben', '🎯', 'pvp', 'clicks', 100, 30),
('Barátok', 'Szerezz 5 barátot', '👥', 'social', 'friends', 5, 25),
('Klán Tag', 'Csatlakozz egy klánhoz', '🏛️', 'social', 'clan', 1, 15); 