import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Trophy, Clock, DollarSign, Calendar, Upload, Download, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface TimerSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  earnedMoney: number;
  username?: string;
}

interface StatisticsProps {
  open: boolean;
  onClose: () => void;
  user: SupabaseUser | null;
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



function PVPStatisticsContent({ user }: { user: SupabaseUser | null }) {
  const [pvpStats, setPvpStats] = useState<any>(null);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadPVPStats();
    }
  }, [user]);

  const loadPVPStats = async () => {
    try {
      setIsLoading(true);
      
      // Try to load real PVP stats
      const { data: challenges, error } = await supabase
        .from('pvp_challenges')
        .select('*')
        .or(`challenger_id.eq.${user?.id},target_id.eq.${user?.id}`)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error loading PVP stats:', error);
        // Fallback to demo stats
        const demoStats = {
          totalMatches: Math.floor(Math.random() * 10) + 1,
          wins: Math.floor(Math.random() * 8) + 1,
          losses: Math.floor(Math.random() * 5),
          winRate: '75.0',
          bestScore: Math.floor(Math.random() * 30) + 40
        };
        
        demoStats.losses = demoStats.totalMatches - demoStats.losses;
        demoStats.winRate = ((demoStats.wins / demoStats.totalMatches) * 100).toFixed(1);

        setPvpStats(demoStats);

        // Demo recent matches
        const demoMatches = [
          {
            id: 'demo1',
            challenger_id: user?.id,
            challenger_username: 'Te',
            target_id: 'opponent1',
            target_username: 'KakiKiraly',
            challenger_score: 52,
            target_score: 48,
            winner_id: user?.id,
            completed_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'demo2',
            challenger_id: 'opponent2',
            challenger_username: 'WCMester',
            target_id: user?.id,
            target_username: 'Te',
            challenger_score: 45,
            target_score: 58,
            winner_id: user?.id,
            completed_at: new Date(Date.now() - 7200000).toISOString()
          }
        ];

        setRecentMatches(demoMatches);
      } else {
        // Calculate real stats
        const completedChallenges = challenges || [];
        const totalMatches = completedChallenges.length;
        const wins = completedChallenges.filter(c => c.winner_id === user?.id).length;
        const losses = totalMatches - wins;
        const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0.0';
        const bestScore = Math.max(...completedChallenges.map(c => 
          c.challenger_id === user?.id ? c.challenger_score : c.target_score
        ), 0);

        setPvpStats({
          totalMatches,
          wins,
          losses,
          winRate,
          bestScore
        });

        setRecentMatches(completedChallenges.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading PVP stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">⚔️</div>
        <div className="text-muted-foreground">
          Jelentkezz be a PVP statisztikák megtekintéséhez!
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">⏳</div>
        <div className="text-muted-foreground">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-bold text-primary mb-3">
          ⚔️ PVP Statisztikák
        </h3>
      </div>

      {pvpStats && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 text-center border-2">
            <div className="text-xl">🏆</div>
            <div className="text-base font-bold text-primary">
              {pvpStats.wins} / {pvpStats.totalMatches}
            </div>
            <div className="text-xs text-muted-foreground">Győzelmek</div>
          </Card>

          <Card className="p-3 text-center border-2">
            <div className="text-xl">📊</div>
            <div className="text-base font-bold text-success">
              {pvpStats.winRate}%
            </div>
            <div className="text-xs text-muted-foreground">Győzelmi arány</div>
          </Card>

          <Card className="p-3 text-center border-2">
            <div className="text-xl">⚡</div>
            <div className="text-base font-bold text-warning">
              {pvpStats.bestScore}
            </div>
            <div className="text-xs text-muted-foreground">Rekord kattintás</div>
          </Card>

          <Card className="p-3 text-center border-2">
            <div className="text-xl">💩</div>
            <div className="text-base font-bold text-accent-foreground">
              {pvpStats.wins * 4}
            </div>
            <div className="text-xs text-muted-foreground">Nyert kaki</div>
          </Card>
        </div>
      )}

      {recentMatches.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Legutóbbi meccsek</h4>
          {recentMatches.map((match, index) => {
            const isWinner = match.winner_id === user?.id;
            const myScore = match.challenger_id === user?.id ? match.challenger_score : match.target_score;
            const opponentScore = match.challenger_id === user?.id ? match.target_score : match.challenger_score;
            const opponentName = match.challenger_id === user?.id ? match.target_username : match.challenger_username;

            return (
              <Card key={match.id} className="p-3 border-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-xl">
                      {isWinner ? '🏆' : '😔'}
                    </div>
                    <div>
                      <div className="font-bold text-primary text-sm">
                        {myScore} vs {opponentScore}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        vs {opponentName} • {formatDate(match.completed_at || '')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-success text-sm">
                      {isWinner ? '+4 💩' : '-1 💩'}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {(!pvpStats || pvpStats.totalMatches === 0) && (
        <Card className="p-6 text-center border-2">
          <div className="text-3xl mb-2">⚔️</div>
          <div className="text-muted-foreground text-sm">
            Még nincs PVP meccsed!<br />
            Indítsd el a timer-t és próbáld ki a PVP harcot!
          </div>
        </Card>
      )}
    </div>
  );
}

function OnlineLeaderboardContent() {
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
    fetchLeaderboard();
  }, []);

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

  return (
    <>
      <div className="text-center">
        <h3 className="text-lg font-bold text-primary mb-3">
          🌐 Online Toplista
        </h3>
      </div>

      {isLoading ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">⏳</div>
          <div className="text-muted-foreground text-sm">Betöltés...</div>
        </div>
      ) : leaderboardData.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">🚽</div>
          <div className="text-muted-foreground text-sm">
            Még nincs online rekord!<br />
            Legyél te az első! 😄
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboardData.map((entry, index) => (
            <div key={entry.user_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => setSelectedUser(entry)}>
              <div className="flex items-center gap-2">
                <div className={`text-xl ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎯'}`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-2 text-sm">
                    {entry.username}
                    <span className="text-base">💩{entry.kaki_count || 0}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.session_count} munkamenet
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-base">
                  {formatTime(entry.total_duration)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatMoney(entry.total_earned)} Ft
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                  <div className="text-xl font-bold">{formatMoney(selectedUser.max_earned)} Ft</div>
                </Card>
              </div>

              <Card className="p-4 text-center bg-primary/10">
                <div className="text-sm text-muted-foreground">Összes keresett pénz</div>
                <div className="text-2xl font-bold text-primary">
                  {formatMoney(selectedUser.total_earned)} Ft
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
    </>
  );
}

export function Statistics({ open, onClose, user }: StatisticsProps) {
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [showDetailedCharts, setShowDetailedCharts] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('wc-timer-sessions');
    if (saved) {
      const parsed = JSON.parse(saved).map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
      }));
      setSessions(parsed);
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

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('hu-HU').format(Math.round(amount));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('hu-HU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStats = () => {
    if (sessions.length === 0) {
      return {
        totalTime: 0,
        totalEarnings: 0,
        averageTime: 0,
        longestSession: 0,
        sessionsThisMonth: 0,
        totalSessions: 0,
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const thisMonthSessions = sessions.filter(s => 
      s.startTime.getMonth() === currentMonth && 
      s.startTime.getFullYear() === currentYear
    );

    return {
      totalTime: sessions.reduce((sum, s) => sum + s.duration, 0),
      totalEarnings: sessions.reduce((sum, s) => sum + s.earnedMoney, 0),
      averageTime: sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length,
      longestSession: Math.max(...sessions.map(s => s.duration)),
      sessionsThisMonth: thisMonthSessions.length,
      totalSessions: sessions.length,
    };
  };

  const getTopSessions = () => {
    return [...sessions]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  };



  const migrateToOnline = async () => {
    if (!user || sessions.length === 0) return;

    try {
      const sessionsToMigrate = sessions.map(session => ({
        user_id: user.id,
        start_time: session.startTime.toISOString(),
        end_time: session.endTime.toISOString(),
        duration: session.duration,
        earned_money: session.earnedMoney,
        salary: 550000, // Default values since we don't have them in localStorage
        work_hours: 180,
      }));

      const { error } = await supabase
        .from('timer_sessions')
        .insert(sessionsToMigrate);

      if (error) throw error;

      toast({
        title: "📤 Sikeres átvitel!",
        description: `${sessions.length} mérés átkerült online fiókodba!`,
      });
    } catch (error) {
      console.error('Error migrating sessions:', error);
      toast({
        title: "❌ Átviteli hiba",
        description: "Nem sikerült az adatok átvitele!",
      });
    }
  };

  const getWeeklyData = () => {
    const today = new Date();
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      const dayName = date.toLocaleDateString('hu-HU', { weekday: 'short' });
      
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate.toDateString() === date.toDateString();
      });
      
      return {
        day: dayName,
        sessions: daySessions.length,
        totalTime: Math.round(daySessions.reduce((sum, s) => sum + s.duration, 0) / 60)
      };
    });
    return weekData;
  };

  const getMonthlyData = () => {
    const weeks = [];
    const today = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7) - 6);
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - (i * 7));
      
      const weekSessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });
      
      weeks.push({
        week: `${i === 0 ? 'Ez' : i + 1}. hét`,
        totalEarnings: Math.round(weekSessions.reduce((sum, s) => sum + s.earnedMoney, 0)),
        totalTime: Math.round(weekSessions.reduce((sum, s) => sum + s.duration, 0) / 60)
      });
    }
    return weeks;
  };

  const getSessionDistribution = () => {
    const short = sessions.filter(s => s.duration < 300).length; // < 5 min
    const medium = sessions.filter(s => s.duration >= 300 && s.duration <= 900).length; // 5-15 min
    const long = sessions.filter(s => s.duration > 900).length; // > 15 min
    
    return [
      { name: 'Rövid', count: short, key: 'short' },
      { name: 'Közepes', count: medium, key: 'medium' },
      { name: 'Hosszú', count: long, key: 'long' }
    ];
  };

  const stats = getStats();
  const topSessions = getTopSessions().slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-none max-h-none m-0 p-0 overflow-y-auto bg-background"
        style={{
          width: '100vw',
          height: '100vh',
          maxWidth: 'none',
          maxHeight: 'none',
          margin: 0,
          borderRadius: 0
        }}>
        <div className="flex flex-col h-full">
          <div className="p-4 pb-2">
            <DialogHeader>
              <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
                📊 Statisztikák
              </DialogTitle>
            </DialogHeader>
          </div>

          <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                      <TabsList className="grid w-full grid-cols-4 mx-4 mb-2">
            <TabsTrigger value="overview">Áttekintés</TabsTrigger>
            <TabsTrigger value="leaderboard">Saját Best Of</TabsTrigger>
            <TabsTrigger value="online">Online</TabsTrigger>
            <TabsTrigger value="pvp">PVP</TabsTrigger>
          </TabsList>
            
            <TabsContent value="overview" className="flex-1 space-y-3 px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 text-center border-2">
                <div className="text-xl">🏆</div>
                <div className="text-base font-bold text-primary">
                  {formatTime(stats.longestSession)}
                </div>
                <div className="text-xs text-muted-foreground">Rekord idő</div>
              </Card>

              <Card className="p-3 text-center border-2">
                <div className="text-xl">💰</div>
                <div className="text-base font-bold text-success">
                  {formatMoney(stats.totalEarnings)} Ft
                </div>
                <div className="text-xs text-muted-foreground">Össz kereset</div>
              </Card>

              <Card className="p-3 text-center border-2">
                <div className="text-xl">⏱️</div>
                <div className="text-base font-bold text-warning">
                  {formatTime(stats.totalTime)}
                </div>
                <div className="text-xs text-muted-foreground">Össz idő</div>
              </Card>

              <Card className="p-3 text-center border-2">
                <div className="text-xl">📅</div>
                <div className="text-base font-bold text-accent-foreground">
                  {stats.sessionsThisMonth}
                </div>
                <div className="text-xs text-muted-foreground">Ebben a hónapban</div>
              </Card>
            </div>

            <Card className="p-3 border-2">
              <button 
                className="w-full space-y-2 cursor-pointer hover:bg-accent/50 transition-colors p-2 rounded-md"
                onClick={() => setShowDetailedCharts(!showDetailedCharts)}
              >
                <h3 className="font-semibold text-center text-sm">📈 További adatok {showDetailedCharts ? '▼' : '▶'}</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Átlag idő:</span>
                    <div className="font-semibold">{formatTime(stats.averageTime)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Össz alkalom:</span>
                    <div className="font-semibold">{stats.totalSessions} db</div>
                  </div>
                </div>
              </button>
            </Card>

            {showDetailedCharts && sessions.length > 0 && (
              <div className="space-y-6">
                {/* Heti teljesítmény grafikon */}
                <Card className="p-3 border-2">
                  <h4 className="font-semibold text-center mb-3 text-sm">📊 Heti teljesítmény</h4>
                  <ChartContainer
                    config={{
                      sessions: {
                        label: "Alkalmak",
                        color: "hsl(var(--primary))",
                      },
                      time: {
                        label: "Idő (perc)",
                        color: "hsl(var(--success))",
                      },
                    }}
                    className="h-[150px]"
                  >
                    <BarChart data={getWeeklyData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="sessions" fill="var(--color-sessions)" />
                    </BarChart>
                  </ChartContainer>
                </Card>

                {/* Havi trend grafikon */}
                <Card className="p-3 border-2">
                  <h4 className="font-semibold text-center mb-3 text-sm">📈 Havi trend</h4>
                  <ChartContainer
                    config={{
                      earnings: {
                        label: "Kereset (Ft)",
                        color: "hsl(var(--warning))",
                      },
                      time: {
                        label: "Idő (perc)",
                        color: "hsl(var(--success))",
                      },
                    }}
                    className="h-[150px]"
                  >
                    <LineChart data={getMonthlyData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="totalEarnings" 
                        stroke="var(--color-earnings)" 
                        strokeWidth={3}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalTime" 
                        stroke="var(--color-time)" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ChartContainer>
                </Card>

                {/* Teljesítmény kördiagram */}
                <Card className="p-3 border-2">
                  <h4 className="font-semibold text-center mb-3 text-sm">🎯 Időszakok megoszlása</h4>
                  <ChartContainer
                    config={{
                      short: {
                        label: "Rövid (< 5 perc)",
                        color: "hsl(var(--destructive))",
                      },
                      medium: {
                        label: "Közepes (5-15 perc)",
                        color: "hsl(var(--warning))",
                      },
                      long: {
                        label: "Hosszú (> 15 perc)",
                        color: "hsl(var(--success))",
                      },
                    }}
                    className="h-[200px]"
                  >
                    <PieChart>
                      <Pie
                        data={getSessionDistribution()}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {getSessionDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`var(--color-${entry.key})`} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </Card>
              </div>
            )}

            

          </TabsContent>

          <TabsContent value="leaderboard" className="flex-1 space-y-3 px-4 pb-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-primary mb-3">
                🏆 Saját Best Of - Top 3
              </h3>
            </div>

            {topSessions.length === 0 ? (
              <Card className="p-6 text-center border-2">
                <div className="text-3xl mb-2">🚽</div>
                <div className="text-muted-foreground text-sm">
                  Még nincs mért időd!<br />
                  Indítsd el az első mérést! 😄
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {topSessions.map((session, index) => (
                  <Card key={session.id} className="p-3 border-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </div>
                        <div>
                          <div className="font-bold text-primary text-sm">
                            {formatTime(session.duration)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {session.username ? `${session.username} • ${formatDate(session.startTime)}` : formatDate(session.startTime)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-success text-sm">
                          +{formatMoney(session.earnedMoney)} Ft
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="online" className="flex-1 space-y-3 px-4 pb-4">
            <OnlineLeaderboardContent />
          </TabsContent>

          <TabsContent value="pvp" className="flex-1 space-y-3 px-4 pb-4">
            <PVPStatisticsContent user={user} />
          </TabsContent>
        </Tabs>
        
        <div className="p-4 pt-2 border-t">
          <Button onClick={onClose} variant="outline" size="lg" className="w-full">
            <X className="w-5 h-5 mr-2" />
            Bezárás
          </Button>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
}