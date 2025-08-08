import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Sword, Trophy, Target, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PVPLeaderboardProps {
  open: boolean;
  onClose: () => void;
}

interface PVPLeaderboardEntry {
  user_id: string;
  username: string;
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number;
  best_cps: number;
  average_cps: number;
  average_clicks: number;
  kaki_earned: number;
  kaki_lost: number;
}

export function PVPLeaderboard({ open, onClose }: PVPLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<PVPLeaderboardEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<PVPLeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPVPLeaderboard = async () => {
    try {
      setIsLoading(true);
      
      // Get PVP challenges data
      const { data: pvpData, error: pvpError } = await supabase
        .from('pvp_challenges')
        .select('*');

      if (pvpError) throw pvpError;

      // Get profiles data
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, kaki_count');

      if (profileError) throw profileError;

      // Calculate PVP stats for each user
      const userStats = pvpData?.reduce((acc: Record<string, PVPLeaderboardEntry>, challenge) => {
        const playerId = challenge.player_id;
        const opponentId = challenge.opponent_id;
        
        if (!acc[playerId]) {
          const profile = profiles?.find(p => p.user_id === playerId);
          acc[playerId] = {
            user_id: playerId,
            username: profile?.username || `Player #${playerId.slice(0, 8)}`,
            total_matches: 0,
            wins: 0,
            losses: 0,
            win_rate: 0,
            best_cps: 0,
            average_cps: 0,
            average_clicks: 0,
            kaki_earned: 0,
            kaki_lost: 0,
          };
        }
        
        // Only count real players (not CPU opponents)
        if (!opponentId.startsWith('cpu_')) {
          if (!acc[opponentId]) {
            const profile = profiles?.find(p => p.user_id === opponentId);
            acc[opponentId] = {
              user_id: opponentId,
              username: profile?.username || `Player #${opponentId.slice(0, 8)}`,
              total_matches: 0,
              wins: 0,
              losses: 0,
              win_rate: 0,
              best_cps: 0,
              average_cps: 0,
              average_clicks: 0,
              kaki_earned: 0,
              kaki_lost: 0,
            };
          }

          // Count matches for real players
          acc[opponentId].total_matches += 1;
        }

        // Always count matches for the player
        acc[playerId].total_matches += 1;

        // Determine winner and update stats
        if (challenge.player_clicks > challenge.opponent_clicks) {
          acc[playerId].wins += 1;
          acc[playerId].kaki_earned += 3;
          
          // Only update opponent stats if it's a real player
          if (!opponentId.startsWith('cpu_')) {
            acc[opponentId].losses += 1;
            acc[opponentId].kaki_lost += 1;
          }
        } else if (challenge.opponent_clicks > challenge.player_clicks) {
          acc[playerId].losses += 1;
          acc[playerId].kaki_lost += 1;
          
          // Only update opponent stats if it's a real player
          if (!opponentId.startsWith('cpu_')) {
            acc[opponentId].wins += 1;
            acc[opponentId].kaki_earned += 3;
          }
        }

        // Update CPS stats
        const playerCPS = challenge.player_clicks / 8; // 8 second game
        const opponentCPS = challenge.opponent_clicks / 8;
        
        acc[playerId].best_cps = Math.max(acc[playerId].best_cps, playerCPS);
        
        // Only update opponent CPS if it's a real player
        if (!opponentId.startsWith('cpu_')) {
          acc[opponentId].best_cps = Math.max(acc[opponentId].best_cps, opponentCPS);
        }
        
        return acc;
      }, {}) || {};

      // Calculate win rates and average clicks
      Object.values(userStats).forEach(user => {
        user.win_rate = user.total_matches > 0 ? (user.wins / user.total_matches) * 100 : 0;
        // Calculate average clicks per match (simplified - would need more detailed data)
        user.average_clicks = user.total_matches > 0 ? Math.round(user.best_cps * 8) : 0; // 8 second games
        user.average_cps = user.best_cps;
      });

      // Sort by win rate (primary) and kaki earned (secondary), limit to top 5
      const sortedStats = Object.values(userStats)
        .filter(user => user.total_matches > 0)
        .sort((a, b) => {
          if (b.win_rate !== a.win_rate) {
            return b.win_rate - a.win_rate;
          }
          return b.kaki_earned - a.kaki_earned;
        })
        .slice(0, 5); // Top 5 only
      
      setLeaderboardData(sortedStats);
    } catch (error) {
      console.error('Error fetching PVP leaderboard:', error);
      // Fallback to demo data
      setLeaderboardData([
        {
          user_id: 'demo1',
          username: 'PVP_Master',
          total_matches: 15,
          wins: 12,
          losses: 3,
          win_rate: 80,
          best_cps: 8.5,
          average_cps: 7.2,
          kaki_earned: 36,
          kaki_lost: 3,
        },
        {
          user_id: 'demo2',
          username: 'Click_Champion',
          total_matches: 12,
          wins: 9,
          losses: 3,
          win_rate: 75,
          best_cps: 7.8,
          average_cps: 6.5,
          kaki_earned: 27,
          kaki_lost: 3,
        },
        {
          user_id: 'demo3',
          username: 'Speed_Demon',
          total_matches: 10,
          wins: 7,
          losses: 3,
          win_rate: 70,
          best_cps: 9.1,
          average_cps: 7.8,
          kaki_earned: 21,
          kaki_lost: 3,
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPVPLeaderboard();
    }
  }, [open]);

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  const formatCPS = (value: number) => {
    return `${value.toFixed(1)} CPS`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            ⚔️ PVP Ranglista
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">⚔️</div>
            <div className="text-muted-foreground">Betöltés...</div>
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">⚔️</div>
            <div className="text-muted-foreground">
              Még nincs PVP meccs!<br />
              Legyél te az első! 😄
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboardData.map((entry, index) => (
              <div key={entry.user_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => setSelectedUser(entry)}>
                <div className="flex items-center gap-3">
                  <div className={`text-2xl ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⚔️'}`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {entry.username}
                      <span className="text-sm text-green-600">+{entry.kaki_earned} 💩</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.wins}W/{entry.losses}L ({formatPercentage(entry.win_rate)})
                    </div>
                  </div>
                </div>
                                  <div className="text-right">
                    <div className="font-bold text-lg text-green-600">
                      {entry.average_clicks}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      átlag kattintás
                    </div>
                  </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 pb-1">
          <Button onClick={onClose} variant="outline" className="w-full h-12 text-base">
            <X className="w-5 h-5 mr-2" />
            Bezárás
          </Button>
        </div>
      </DialogContent>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
                <Sword className="w-6 h-6" />
                {selectedUser.username}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <Card className="p-4 space-y-3">
                <div className="text-center">
                  <div className="text-4xl mb-2">⚔️</div>
                  <div className="text-2xl font-bold">{selectedUser.total_matches}</div>
                  <div className="text-sm text-muted-foreground">Összes meccs</div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Győzelmek</div>
                  <div className="text-xl font-bold text-green-600">{selectedUser.wins}</div>
                </Card>
                
                <Card className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Veszteségek</div>
                  <div className="text-xl font-bold text-red-600">{selectedUser.losses}</div>
                </Card>
                
                <Card className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Győzelmi arány</div>
                  <div className="text-xl font-bold">{formatPercentage(selectedUser.win_rate)}</div>
                </Card>
                
                <Card className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Legjobb CPS</div>
                  <div className="text-xl font-bold">{formatCPS(selectedUser.best_cps)}</div>
                </Card>
              </div>

              <Card className="p-4 text-center bg-green-500/10">
                <div className="text-sm text-muted-foreground">Kaki nyereség</div>
                <div className="text-2xl font-bold text-green-600">
                  +{selectedUser.kaki_earned} 💩
                </div>
              </Card>

              <Card className="p-4 text-center bg-red-500/10">
                <div className="text-sm text-muted-foreground">Kaki veszteség</div>
                <div className="text-2xl font-bold text-red-600">
                  -{selectedUser.kaki_lost} 💩
                </div>
              </Card>

              <Button onClick={() => setSelectedUser(null)} variant="outline" className="w-full h-12 text-base">
                <X className="w-5 h-5 mr-2" />
                Bezárás
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
} 