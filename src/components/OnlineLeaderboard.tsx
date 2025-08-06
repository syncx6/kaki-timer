import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Crown, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OnlineSession {
  id: string;
  duration: number;
  earned_money: number;
  created_at: string;
  profiles: {
    username: string;
  } | null;
}

interface OnlineLeaderboardProps {
  open: boolean;
  onClose: () => void;
}

export function OnlineLeaderboard({ open, onClose }: OnlineLeaderboardProps) {
  const [sessions, setSessions] = useState<OnlineSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLeaderboard();
    }
  }, [open]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('timer_sessions')
        .select(`
          id,
          duration,
          earned_money,
          created_at,
          user_id
        `)
        .order('duration', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch usernames separately
      const userIds = [...new Set(data?.map(s => s.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const sessionsWithProfiles = data?.map(session => ({
        ...session,
        profiles: profiles?.find(p => p.user_id === session.user_id) || null
      })) || [];

      setSessions(sessionsWithProfiles);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('hu-HU').format(Math.round(amount));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('hu-HU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getTopSessions = () => {
    return sessions.slice(0, 10);
  };

  const getTopEarners = () => {
    return [...sessions]
      .sort((a, b) => b.earned_money - a.earned_money)
      .slice(0, 10);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            🌐 Online Toplista
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="time" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="time">⏱️ Legjobb Idők</TabsTrigger>
            <TabsTrigger value="money">💰 Legtöbb Pénz</TabsTrigger>
          </TabsList>
          
          <TabsContent value="time" className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-primary mb-4">
                🏆 Rekord Időtartamok
              </h3>
            </div>

            {loading ? (
              <Card className="p-8 text-center border-2">
                <div className="text-4xl mb-2">⏳</div>
                <div className="text-muted-foreground">Betöltés...</div>
              </Card>
            ) : getTopSessions().length === 0 ? (
              <Card className="p-8 text-center border-2">
                <div className="text-4xl mb-2">🚽</div>
                <div className="text-muted-foreground">
                  Még nincs online rekord!<br />
                  Legyél te az első! 😄
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {getTopSessions().map((session, index) => (
                  <Card key={session.id} className="p-4 border-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </div>
                        <div>
                          <div className="font-bold text-primary">
                            {formatTime(session.duration)}
                          </div>
                          <div className="text-sm font-semibold text-accent-foreground">
                            @{session.profiles?.username || 'Névtelen'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(session.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-success">
                          +{formatMoney(session.earned_money)} Ft
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="money" className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-primary mb-4">
                💰 Legtöbb Kereset
              </h3>
            </div>

            {loading ? (
              <Card className="p-8 text-center border-2">
                <div className="text-4xl mb-2">⏳</div>
                <div className="text-muted-foreground">Betöltés...</div>
              </Card>
            ) : getTopEarners().length === 0 ? (
              <Card className="p-8 text-center border-2">
                <div className="text-4xl mb-2">💸</div>
                <div className="text-muted-foreground">
                  Még nincs online kereset!<br />
                  Keress pénzt kakilás közben! 😄
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {getTopEarners().map((session, index) => (
                  <Card key={session.id} className="p-4 border-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </div>
                        <div>
                          <div className="font-bold text-success">
                            +{formatMoney(session.earned_money)} Ft
                          </div>
                          <div className="text-sm font-semibold text-accent-foreground">
                            @{session.profiles?.username || 'Névtelen'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(session.created_at)} • {formatTime(session.duration)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Crown className="w-6 h-6 text-warning" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="pt-4">
          <Button onClick={onClose} variant="outline" size="lg" className="w-full">
            <X className="w-5 h-5 mr-2" />
            Bezárás
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}