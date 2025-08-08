import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Trophy, Clock, DollarSign, Calendar, Upload, Download, User, BarChart3, Sword } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSwipeGesture } from '@/hooks/use-swipe-gesture';
import { SwipeIndicator } from '@/components/SwipeIndicator';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { OverviewDashboard } from '@/components/dashboard/OverviewDashboard';
import { PVPDashboard } from '@/components/dashboard/PVPDashboard';
import { TimerDashboard } from '@/components/dashboard/TimerDashboard';
import type { OverviewStats, PVPStats, TimerStats } from '@/types/statistics';

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

interface PVPGameData {
  id: string;
  player_id: string;
  player_username: string;
  player_clicks: number;
  opponent_id: string;
  opponent_username: string;
  opponent_clicks: number;
  created_at: string;
}

function OnlineLeaderboardContent() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, kaki_count')
        .order('kaki_count', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaderboard([]);
      } else {
        // Fetch additional stats for each user
        const leaderboardWithStats = await Promise.all(
          (data || []).map(async (user) => {
            try {
              // Fetch user's timer sessions
              const { data: sessionsData } = await supabase
                .from('timer_sessions')
                .select('duration, earned_money')
                .eq('user_id', user.user_id);

              const totalDuration = sessionsData?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0;
              const totalEarned = sessionsData?.reduce((sum, session) => sum + (session.earned_money || 0), 0) || 0;
              const sessionCount = sessionsData?.length || 0;
              const maxDuration = sessionsData?.reduce((max, session) => Math.max(max, session.duration || 0), 0) || 0;
              const maxEarned = sessionsData?.reduce((max, session) => Math.max(max, session.earned_money || 0), 0) || 0;

              return {
                ...user,
                total_duration: totalDuration,
                total_earned: totalEarned,
                session_count: sessionCount,
                max_duration: maxDuration,
                max_earned: maxEarned
              };
            } catch (error) {
              console.error('Error fetching user stats:', error);
              return {
                ...user,
                total_duration: 0,
                total_earned: 0,
                session_count: 0,
                max_duration: 0,
                max_earned: 0
              };
            }
          })
        );

        setLeaderboard(leaderboardWithStats);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-bold text-primary mb-3">
          🏆 Online Ranglista
        </h3>
        <p className="text-sm text-muted-foreground">
          A legjobb játékosok kaki egyenlege
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Betöltés...</div>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <Card key={entry.user_id} className="p-4 border-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </div>
                  <div>
                    <div className="font-bold text-primary">
                      {entry.username}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.session_count} kakilás
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600 text-lg">
                    {entry.kaki_count} 💩
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(entry.total_duration)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function Statistics({ open, onClose, user }: StatisticsProps) {
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'pvp' | 'timer'>('overview');
  const { toast } = useToast();

  // Tab order for swipe gestures
  const tabOrder: Array<'overview' | 'pvp' | 'timer'> = ['overview', 'pvp', 'timer'];

  const handleSwipeLeft = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    // Only move to next if not at the end
    if (currentIndex < tabOrder.length - 1) {
      const nextIndex = currentIndex + 1;
      setActiveTab(tabOrder[nextIndex]);
    }
  };

  const handleSwipeRight = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    // Only move to previous if not at the beginning
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setActiveTab(tabOrder[prevIndex]);
    }
  };

  // Swipe gesture hook
  const swipeRef = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    minSwipeDistance: 60,
    maxSwipeTime: 400
  });

  useEffect(() => {
    if (open && user) {
      fetchRealStats();
    }
  }, [open, user]);

  // Add a global function to refresh stats
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshStats = fetchRealStats;
    }
  }, [user]);

  const fetchRealStats = async () => {
    if (!user) return;

    try {
      // Fetch timer sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching timer sessions:', sessionsError);
      }

      // Fetch PVP data from localStorage (since pvp_challenges table might not exist yet)
      let pvpData: PVPGameData[] = [];
      try {
        const localStorageGames = JSON.parse(localStorage.getItem('wc-timer-pvp-games') || '[]');
        const userGames = localStorageGames.filter((game: PVPGameData) => 
          game.player_id === user?.id || game.opponent_id === user?.id
        );
        
        if (userGames.length > 0) {
          pvpData = userGames;
        }
      } catch (error) {
        console.log('Error reading localStorage PVP data:', error);
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('kaki_count')
        .eq('user_id', user?.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Process timer stats
      const timerStats = processTimerStats(sessionsData || []);
      
      // Process PVP stats
      const pvpStats = processPVPStats(pvpData, user?.id || '');
      


      // Calculate total kaki
      const totalKaki = profileData?.kaki_count || 0;

      setStats({
        totalKaki,
        pvpStats,
        timerStats,
        achievements: []
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Only use demo data if there's a real error
      setStats(generateDemoStats());
    }
  };

  // Generate demo data for the new dashboard structure
  const generateDemoStats = (): OverviewStats => {
    const pvpStats: PVPStats = {
      totalMatches: 42,
      wins: 28,
      losses: 14,
      winRate: 67,
      bestCPS: 8.2,
      averageCPS: 6.8,
      bestClickRecord: 89,
      kakiEarned: 84,
      kakiLost: 14,
      weeklyStats: [
        { week: '1. hét', matches: 8, wins: 6, averageCPS: 6.5, kakiEarned: 18 },
        { week: '2. hét', matches: 12, wins: 8, averageCPS: 7.1, kakiEarned: 24 },
        { week: '3. hét', matches: 10, wins: 7, averageCPS: 6.9, kakiEarned: 21 },
        { week: '4. hét', matches: 12, wins: 7, averageCPS: 7.2, kakiEarned: 21 }
      ],
      recentMatches: [
        { id: '1', opponent: 'KakiKiraly', result: 'win', clicks: 67, cps: 8.4, kakiChange: 3, date: new Date() },
        { id: '2', opponent: 'WCMester', result: 'loss', clicks: 45, cps: 5.6, kakiChange: -1, date: new Date() },
        { id: '3', opponent: 'ToiletPro', result: 'win', clicks: 78, cps: 9.8, kakiChange: 3, date: new Date() }
      ]
    };

    const timerStats: TimerStats = {
      totalSessions: 127,
      totalTime: 66720, // 18h 32m
      averageTime: 525, // 8m 45s
      bestTime: 1935, // 32m 15s
      kakiEarned: 342,
      categories: {
        short: 45,
        medium: 52,
        long: 30
      },
      dailyActivity: [
        { date: 'Hétfő', sessions: 3, totalTime: 1800, kakiEarned: 9 },
        { date: 'Kedd', sessions: 4, totalTime: 2400, kakiEarned: 12 },
        { date: 'Szerda', sessions: 2, totalTime: 1200, kakiEarned: 6 },
        { date: 'Csütörtök', sessions: 5, totalTime: 3000, kakiEarned: 15 },
        { date: 'Péntek', sessions: 3, totalTime: 1800, kakiEarned: 9 },
        { date: 'Szombat', sessions: 6, totalTime: 3600, kakiEarned: 18 },
        { date: 'Vasárnap', sessions: 4, totalTime: 2400, kakiEarned: 12 }
      ],
      recentSessions: [
        { id: '1', startTime: new Date(), endTime: new Date(), duration: 480, kakiEarned: 2, category: 'medium' },
        { id: '2', startTime: new Date(), endTime: new Date(), duration: 300, kakiEarned: 1, category: 'short' },
        { id: '3', startTime: new Date(), endTime: new Date(), duration: 900, kakiEarned: 3, category: 'medium' }
      ]
    };

    return {
      totalKaki: 498,
      pvpStats,
      timerStats,
      achievements: []
    };
  };

  const processTimerStats = (sessionsData: any[]): TimerStats => {
    const totalSessions = sessionsData.length;
    const totalTime = sessionsData.reduce((sum, session) => sum + (session.duration || 0), 0);
    const averageTime = totalSessions > 0 ? totalTime / totalSessions : 0;
    const bestTime = totalSessions > 0 ? Math.max(...sessionsData.map(s => s.duration || 0)) : 0;
    const kakiEarned = sessionsData.reduce((sum, session) => sum + (session.kaki_earned || 0), 0);

    // Categorize sessions
    const categories = {
      short: sessionsData.filter(s => (s.duration || 0) >= 60 && (s.duration || 0) < 300).length,
      medium: sessionsData.filter(s => (s.duration || 0) >= 300 && (s.duration || 0) < 900).length,
      long: sessionsData.filter(s => (s.duration || 0) >= 900).length
    };

    // Generate daily activity (last 7 days)
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const daySessions = sessionsData.filter(s => {
        const sessionDate = new Date(s.created_at);
        return sessionDate.toDateString() === date.toDateString();
      });
      
      dailyActivity.push({
        date: date.toLocaleDateString('hu-HU', { weekday: 'short' }),
        sessions: daySessions.length,
        totalTime: daySessions.reduce((sum, s) => sum + (s.duration || 0), 0),
        kakiEarned: daySessions.reduce((sum, s) => sum + (s.kaki_earned || 0), 0)
      });
    }

    // Recent sessions
    const recentSessions = sessionsData.slice(0, 10).map(session => ({
      id: session.id,
      startTime: new Date(session.created_at),
      endTime: new Date(session.created_at),
      duration: session.duration || 0,
      kakiEarned: session.kaki_earned || 0,
      category: ((session.duration || 0) < 300 ? 'short' : (session.duration || 0) < 900 ? 'medium' : 'long') as 'short' | 'medium' | 'long'
    }));

    return {
      totalSessions,
      totalTime,
      averageTime,
      bestTime,
      kakiEarned,
      categories,
      dailyActivity,
      recentSessions
    };
  };

  const processPVPStats = (pvpData: PVPGameData[], userId: string): PVPStats => {
    
    // Include both player and opponent games
    const userMatches = pvpData.filter(match => 
      match.player_id === userId || match.opponent_id === userId
    );


    const totalMatches = userMatches.length;
    const wins = userMatches.filter(match => {
      if (match.player_id === userId) {
        return match.player_clicks > match.opponent_clicks;
      } else {
        return match.opponent_clicks > match.player_clicks;
      }
    }).length;
    
    const losses = totalMatches - wins;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    // Calculate CPS stats
    const userClicks = userMatches.map(match => {
      if (match.player_id === userId) {
        return match.player_clicks;
      } else {
        return match.opponent_clicks;
      }
    });

    const bestCPS = userClicks.length > 0 ? Math.max(...userClicks.map(clicks => clicks / 8)) : 0;
    const averageCPS = userClicks.length > 0 ? userClicks.reduce((sum, clicks) => sum + (clicks / 8), 0) / userClicks.length : 0;
    const bestClickRecord = userClicks.length > 0 ? Math.max(...userClicks) : 0;

    // Calculate kaki stats
    const kakiEarned = wins * 3;
    const kakiLost = losses * 1;

    // Weekly stats (simplified)
    const weeklyStats = [
      { week: '1. hét', matches: Math.floor(totalMatches * 0.25), wins: Math.floor(wins * 0.25), averageCPS: averageCPS * 0.9, kakiEarned: Math.floor(kakiEarned * 0.25) },
      { week: '2. hét', matches: Math.floor(totalMatches * 0.3), wins: Math.floor(wins * 0.3), averageCPS: averageCPS * 0.95, kakiEarned: Math.floor(kakiEarned * 0.3) },
      { week: '3. hét', matches: Math.floor(totalMatches * 0.25), wins: Math.floor(wins * 0.25), averageCPS: averageCPS, kakiEarned: Math.floor(kakiEarned * 0.25) },
      { week: '4. hét', matches: Math.floor(totalMatches * 0.2), wins: Math.floor(wins * 0.2), averageCPS: averageCPS * 1.05, kakiEarned: Math.floor(kakiEarned * 0.2) }
    ];

    // Recent matches
    const recentMatches = userMatches.slice(0, 5).map(match => ({
      id: match.id,
      opponent: match.player_id === userId ? match.opponent_username || 'Unknown' : match.player_username || 'Unknown',
      result: ((match.player_id === userId && match.player_clicks > match.opponent_clicks) || 
              (match.opponent_id === userId && match.opponent_clicks > match.player_clicks) ? 'win' : 'loss') as 'win' | 'loss',
      clicks: match.player_id === userId ? match.player_clicks : match.opponent_clicks,
      cps: (match.player_id === userId ? match.player_clicks : match.opponent_clicks) / 8,
      kakiChange: (match.player_id === userId && match.player_clicks > match.opponent_clicks) || 
                 (match.opponent_id === userId && match.opponent_clicks > match.player_clicks) ? 3 : -1,
      date: new Date(match.created_at)
    }));



    return {
      totalMatches,
      wins,
      losses,
      winRate,
      bestCPS,
      averageCPS,
      bestClickRecord,
      kakiEarned,
      kakiLost,
      weeklyStats,
      recentMatches
    };
  };

  const demoStats = generateDemoStats();
  const currentStats = stats || demoStats;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl mx-auto p-2 sm:p-4 max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pt-2 pb-1">
          <DialogTitle className="text-center text-lg sm:text-2xl flex items-center justify-center gap-2">
            📊 Statisztikák
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'pvp' | 'timer')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0 text-xs sm:text-sm">
            <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Áttekintés</span>
              <span className="sm:hidden">Áttekintés</span>
            </TabsTrigger>
            <TabsTrigger value="pvp" className="flex items-center gap-1 sm:gap-2">
              <Sword className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">PVP Harc</span>
              <span className="sm:hidden">PVP</span>
            </TabsTrigger>
            <TabsTrigger value="timer" className="flex items-center gap-1 sm:gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Kakilás</span>
              <span className="sm:hidden">Timer</span>
            </TabsTrigger>
          </TabsList>

          <div ref={swipeRef} className="flex-1 overflow-y-auto min-h-0 pb-2">
            <TabsContent value="overview" className="h-full min-h-[500px] mt-2">
              <OverviewDashboard stats={currentStats} />
            </TabsContent>

            <TabsContent value="pvp" className="space-y-3 px-2 sm:px-4 pb-2 min-h-[500px] mt-2">
              <PVPDashboard stats={currentStats.pvpStats} />
            </TabsContent>

            <TabsContent value="timer" className="space-y-3 px-2 sm:px-4 pb-2 min-h-[500px] mt-2">
              <TimerDashboard stats={currentStats.timerStats} />
            </TabsContent>
          </div>
          
          {/* Swipe Indicator for Statistics - minimális távolság a gombtól */}
          <div className="flex-shrink-0 px-2 pb-1">
            <SwipeIndicator 
              currentIndex={tabOrder.indexOf(activeTab)}
              totalItems={tabOrder.length}
              labels={['Áttekintés', 'PVP Harc', 'Kakilás']}
            />
          </div>
        </Tabs>

        {/* Fixed bottom button - vastagabb és biztonságos pozíció */}
        <div className="flex-shrink-0 pb-1">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full h-12 text-base"
          >
            <X className="w-5 h-5 mr-2" />
            Bezárás
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}