-- Create PVP challenges table
CREATE TABLE IF NOT EXISTS pvp_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenger_username TEXT NOT NULL,
  target_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_username TEXT NOT NULL,
  challenger_score INTEGER DEFAULT 0,
  target_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  winner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pvp_challenges_challenger_id ON pvp_challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_pvp_challenges_target_id ON pvp_challenges(target_id);
CREATE INDEX IF NOT EXISTS idx_pvp_challenges_status ON pvp_challenges(status);
CREATE INDEX IF NOT EXISTS idx_pvp_challenges_created_at ON pvp_challenges(created_at);

-- Enable RLS
ALTER TABLE pvp_challenges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own challenges" ON pvp_challenges
  FOR SELECT USING (
    auth.uid() = challenger_id OR auth.uid() = target_id
  );

CREATE POLICY "Users can create challenges" ON pvp_challenges
  FOR INSERT WITH CHECK (
    auth.uid() = challenger_id
  );

CREATE POLICY "Users can update their own challenges" ON pvp_challenges
  FOR UPDATE USING (
    auth.uid() = challenger_id OR auth.uid() = target_id
  ); 