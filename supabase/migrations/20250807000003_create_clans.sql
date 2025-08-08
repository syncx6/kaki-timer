-- Create clans table
CREATE TABLE IF NOT EXISTS public.clans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    leader_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    member_count INTEGER DEFAULT 1,
    total_kaki INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clan_members table
CREATE TABLE IF NOT EXISTS public.clan_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contribution_kaki INTEGER DEFAULT 0,
    UNIQUE(clan_id, user_id)
);

-- Enable RLS
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;

-- Create policies for clans
CREATE POLICY "Anyone can view clans" ON public.clans
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own clans" ON public.clans
    FOR INSERT WITH CHECK (auth.uid()::text = leader_id::text);

CREATE POLICY "Clan leaders can update their clans" ON public.clans
    FOR UPDATE USING (auth.uid()::text = leader_id::text);

-- Create policies for clan_members
CREATE POLICY "Users can view clan members" ON public.clan_members
    FOR SELECT USING (true);

CREATE POLICY "Users can insert themselves to clans" ON public.clan_members
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own clan membership" ON public.clan_members
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clans_leader_id ON public.clans(leader_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_clan_id ON public.clan_members(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_user_id ON public.clan_members(user_id); 