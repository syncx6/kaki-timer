import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Trophy, Clock, DollarSign, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OnlineLeaderboardProps {
  open: boolean;
  onClose: () => void;
}

interface LeaderboardEntry {
  user_id: string;
  username: string;
  kaki_count: number;
  total_duration: number;
  total_earned: number;
  session_count: number;
  max_duration: number;
  max_earned: number;
}

export function OnlineLeaderboard({ open, onClose }: OnlineLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('timer_sessions')
        .select('user_id, duration, earned_money');

      if (error) throw error;

      // Get profiles separately
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, kaki_count');

      if (profileError) throw profileError;

      // Group by user and calculate totals
      const userStats = data?.reduce((acc: Record<string, LeaderboardEntry>, session) => {
        if (!acc[session.user_id]) {
          const profile = profiles?.find(p => p.user_id === session.user_id);
          acc[session.user_id] = {
            user_id: session.user_id,
            username: profile?.username || `User #${session.user_id.slice(0, 8)}`,
            kaki_count: profile?.kaki_count || 0,
            total_duration: 0,
            total_earned: 0,
            session_count: 0,
            max_duration: 0,
            max_earned: 0,
          };
        }
        
        acc[session.user_id].total_duration += session.duration;
        acc[session.user_id].total_earned += session.earned_money;
        acc[session.user_id].session_count += 1;
        acc[session.user_id].max_duration = Math.max(acc[session.user_id].max_duration, session.duration);
        acc[session.user_id].max_earned = Math.max(acc[session.user_id].max_earned, session.earned_money);
        
        return acc;
      }, {}) || {};

      // Convert to array and sort by total duration
      const sortedStats = Object.values(userStats).sort((a, b) => b.total_duration - a.total_duration);
      
      setLeaderboardData(sortedStats);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLeaderboard();
    }
  }, [open]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            🏆 Online Toplista
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">⏳</div>
            <div className="text-muted-foreground">Betöltés...</div>
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🚽</div>
            <div className="text-muted-foreground">
              Még nincs online rekord!<br />
              Legyél te az első! 😄
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboardData.map((entry, index) => (
              <div key={entry.user_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => setSelectedUser(entry)}>
                <div className="flex items-center gap-3">
                  <div className={`text-2xl ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎯'}`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {entry.username}
                      <span className="text-lg">💩{entry.kaki_count || 0}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.session_count} munkamenet
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {formatTime(entry.total_duration)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat('hu-HU').format(Math.round(entry.total_earned))} Ft
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4">
          <Button onClick={onClose} variant="outline" size="lg" className="w-full">
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
                  <User className="w-6 h-6" />
                  {selectedUser.username}
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <Card className="p-4 space-y-3">
                <div className="text-center">
                  <div className="text-4xl mb-2">💩</div>
                  <div className="text-2xl font-bold">{selectedUser.kaki_count}</div>
                  <div className="text-sm text-muted-foreground">Kaki jelvény</div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Összes munkamenet</div>
                  <div className="text-xl font-bold">{selectedUser.session_count}</div>
                </Card>
                
                <Card className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Összes idő</div>
                  <div className="text-xl font-bold">{formatTime(selectedUser.total_duration)}</div>
                </Card>
                
                <Card className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Leghosszabb</div>
                  <div className="text-xl font-bold">{formatTime(selectedUser.max_duration)}</div>
                </Card>
                
                <Card className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Legtöbb pénz</div>
                  <div className="text-xl font-bold">{new Intl.NumberFormat('hu-HU').format(Math.round(selectedUser.max_earned))} Ft</div>
                </Card>
              </div>

              <Card className="p-4 text-center bg-primary/10">
                <div className="text-sm text-muted-foreground">Összes keresett pénz</div>
                <div className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat('hu-HU').format(Math.round(selectedUser.total_earned))} Ft
                </div>
              </Card>

              <Button onClick={() => setSelectedUser(null)} variant="outline" size="lg" className="w-full">
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