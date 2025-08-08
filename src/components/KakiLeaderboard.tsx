import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Crown, Clock, TrendingUp, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface KakiLeaderboardProps {
  open: boolean;
  onClose: () => void;
}

interface KakiLeaderboardEntry {
  user_id: string;
  username: string;
  kaki_count: number;
  total_sessions: number;
  total_time: number;
  average_time: number;
  best_time: number;
  kaki_per_hour: number;
}

export function KakiLeaderboard({ open, onClose }: KakiLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<KakiLeaderboardEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<KakiLeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchKakiLeaderboard = async () => {
    try {
      setIsLoading(true);
      
      // Get profiles data (kaki count)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, kaki_count');

      if (profileError) throw profileError;

      // Get timer sessions data
      const { data: sessions, error: sessionError } = await supabase
        .from('timer_sessions')
        .select('user_id, duration, earned_money');

      if (sessionError) throw sessionError;

      // Calculate stats for each user
      const userStats = profiles?.reduce((acc: Record<string, KakiLeaderboardEntry>, profile) => {
        const userSessions = sessions?.filter(s => s.user_id === profile.user_id) || [];
        
        const totalTime = userSessions.reduce((sum, session) => sum + session.duration, 0);
        const averageTime = userSessions.length > 0 ? totalTime / userSessions.length : 0;
        const bestTime = userSessions.length > 0 ? Math.max(...userSessions.map(s => s.duration)) : 0;
        const kakiPerHour = totalTime > 0 ? (profile.kaki_count || 0) / (totalTime / 3600) : 0;

        acc[profile.user_id] = {
          user_id: profile.user_id,
          username: profile.username || `User #${profile.user_id.slice(0, 8)}`,
          kaki_count: profile.kaki_count || 0,
          total_sessions: userSessions.length,
          total_time: totalTime,
          average_time: averageTime,
          best_time: bestTime,
          kaki_per_hour: kakiPerHour,
        };
        
        return acc;
      }, {}) || {};

      // Sort by kaki count (primary) and total time (secondary), limit to top 5
      const sortedStats = Object.values(userStats)
        .filter(user => user.kaki_count > 0 || user.total_sessions > 0)
        .sort((a, b) => {
          if (b.kaki_count !== a.kaki_count) {
            return b.kaki_count - a.kaki_count;
          }
          return b.total_time - a.total_time;
        })
        .slice(0, 5); // Top 5 only
      
      setLeaderboardData(sortedStats);
    } catch (error) {
      console.error('Error fetching kaki leaderboard:', error);
      // Fallback to demo data
      setLeaderboardData([
        {
          user_id: 'demo1',
          username: 'Kaki_King',
          kaki_count: 156,
          total_sessions: 45,
          total_time: 7200, // 2 hours
          average_time: 160, // 2:40
          best_time: 1800, // 30 minutes
          kaki_per_hour: 78,
        },
        {
          user_id: 'demo2',
          username: 'Poop_Master',
          kaki_count: 89,
          total_sessions: 32,
          total_time: 4800, // 1:20 hours
          average_time: 150, // 2:30
          best_time: 1200, // 20 minutes
          kaki_per_hour: 67,
        },
        {
          user_id: 'demo3',
          username: 'Bathroom_Boss',
          kaki_count: 67,
          total_sessions: 28,
          total_time: 3600, // 1 hour
          average_time: 129, // 2:09
          best_time: 900, // 15 minutes
          kaki_per_hour: 67,
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchKakiLeaderboard();
    }
  }, [open]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatKakiPerHour = (value: number) => {
    return `${value.toFixed(1)}/h`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            👑 Kaki Ranglista
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💩</div>
            <div className="text-muted-foreground">Betöltés...</div>
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💩</div>
            <div className="text-muted-foreground">
              Még nincs kaki gyűjtő!<br />
              Legyél te az első! 😄
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboardData.map((entry, index) => (
              <div key={entry.user_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => setSelectedUser(entry)}>
                <div className="flex items-center gap-3">
                  <div className={`text-2xl ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👑'}`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {entry.username}
                      <span className="text-lg">💩{entry.kaki_count}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.total_sessions} munkamenet
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-yellow-600">
                    {entry.kaki_count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatKakiPerHour(entry.kaki_per_hour)}
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
                <Crown className="w-6 h-6" />
                {selectedUser.username}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <Card className="p-4 space-y-3">
                <div className="text-center">
                  <div className="text-4xl mb-2">💩</div>
                  <div className="text-2xl font-bold">{selectedUser.kaki_count}</div>
                  <div className="text-sm text-muted-foreground">Kaki egyenleg</div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Munkamenetek</div>
                  <div className="text-xl font-bold">{selectedUser.total_sessions}</div>
                </Card>
                
                <Card className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Összes idő</div>
                  <div className="text-xl font-bold">{formatTime(selectedUser.total_time)}</div>
                </Card>
                
                <Card className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Átlagos idő</div>
                  <div className="text-xl font-bold">{formatTime(selectedUser.average_time)}</div>
                </Card>
                
                <Card className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Legjobb idő</div>
                  <div className="text-xl font-bold">{formatTime(selectedUser.best_time)}</div>
                </Card>
              </div>

              <Card className="p-4 text-center bg-yellow-500/10">
                <div className="text-sm text-muted-foreground">Kaki/óra</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatKakiPerHour(selectedUser.kaki_per_hour)}
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