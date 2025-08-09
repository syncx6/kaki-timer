import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Square, Clock, DollarSign, Trophy, TrendingUp, Sword, Target, Zap, BarChart3, Gift, Flame, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDailyFeatures } from '@/hooks/use-daily-features';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface TimerSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  earnedMoney: number;
  kaki_earned?: number;
  username?: string;
}

interface PVPGame {
  id: string;
  player_id: string;
  winner_id: string;
  created_at: string;
}

interface HomePageProps {
  salary: number;
  workHours: number;
  user: SupabaseUser | null;
  username: string;
  isRunning: boolean;
  seconds: number;
  currentEarnings: number;
  kakiCount: number;
  totalEarnings: number;
  onStartTimer: () => void;
  onStopTimer: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onKakiUpdate?: (change: number) => void;
  onNavigateToGames?: () => void;
  onOpenPVPGame?: () => void;
  onPVPStatsRefresh?: () => void;
}

export function HomePage({ 
  salary, 
  workHours, 
  user, 
  username,
  isRunning,
  seconds,
  currentEarnings,
  kakiCount,
  totalEarnings,
  onStartTimer,
  onStopTimer,
  onOpenSettings, 
  onOpenStats, 
  onOpenAuth, 
  onLogout,
  onKakiUpdate,
  onNavigateToGames,
  onOpenPVPGame,
  onPVPStatsRefresh
}: HomePageProps) {
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [showProgressCheck, setShowProgressCheck] = useState(false);
  const [lastProgressCheck, setLastProgressCheck] = useState<Date | null>(null);
  const { toast } = useToast();
  
  // Daily features hook
  const { dailyStats, openDailyGift, incrementDailyTimerSessions, updatePVPStats, refreshStats } = useDailyFeatures(user);

  // Set up global refresh function for PVP stats
  useEffect(() => {
    (window as any).refreshHomePageStats = () => {
      console.log('Refreshing HomePage PVP stats...');
      refreshStats();
    };

    // Cleanup on unmount
    return () => {
      delete (window as any).refreshHomePageStats;
    };
  }, [refreshStats]);

  // Load sessions from Supabase for the current user only
  useEffect(() => {
    const fetchUserSessions = async () => {
      if (!user) {
        setSessions([]);
        return;
      }

      try {
        const { data: sessionsData, error } = await supabase
          .from('timer_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching user sessions:', error);
          setSessions([]);
          return;
        }

        if (sessionsData && sessionsData.length > 0) {
          const parsed = sessionsData.map((s: any) => ({
            id: s.id,
            startTime: new Date(s.start_time),
            endTime: new Date(s.end_time),
            duration: s.duration,
            earnedMoney: s.earned_money || 0,
            kaki_earned: s.kaki_earned || 0,
            username: s.user_id
          }));
          setSessions(parsed);
        } else {
          setSessions([]);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setSessions([]);
      }
    };

    fetchUserSessions();
  }, [user]);

  const handleStartTimer = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    onStartTimer();
    // Increment daily timer sessions counter
    incrementDailyTimerSessions();
  };

  const handleStopTimer = () => {
    onStopTimer();
  };

  // Get dynamic border colors based on stats
  const getDailySessionsBorderColor = () => {
    const sessions = dailyStats.dailyTimerSessions;
    if (sessions === 0) return 'border-red-400';
    if (sessions === 1) return 'border-orange-400';
    return 'border-green-400';
  };

  const getPVPWinRateBorderColor = () => {
    const winRate = dailyStats.pvpWinRate;
    if (winRate >= 80) return 'border-green-400';
    if (winRate >= 50) return 'border-orange-400';
    return 'border-red-400';
  };

  const getGiftBoxBorderColor = () => {
    if (!dailyStats.canOpenGift) return 'border-red-400'; // Már kinyitva - piros
    return 'border-green-400 animate-slow-pulse'; // Elérhető - zöld pulzálás
  };

  // Handle daily gift opening
  const handleOpenGift = async () => {
    const result = await openDailyGift();
    if (result.success) {
      toast({
        title: "🎁 Ajándék kinyitva!",
        description: result.message,
        duration: 3000,
      });
      // Update parent component's kaki count if needed
      if (onKakiUpdate) {
        onKakiUpdate(result.kakiAmount);
      }
    } else {
      toast({
        title: "❌ Hiba",
        description: result.message,
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('hu-HU').format(Math.round(amount));
  };

  const getRecord = () => {
    if (sessions.length === 0) return null;
    return Math.max(...sessions.map(s => s.duration));
  };

  const getTotalTime = () => {
    return sessions.reduce((total, session) => total + session.duration, 0);
  };

  const getTotalEarnings = () => {
    return sessions.reduce((total, session) => total + session.earnedMoney, 0);
  };

  const getRecentActivity = () => {
    return sessions.slice(0, 3);
  };

  // Calculate next goal (record + 30 seconds)
  const getNextGoal = () => {
    const record = getRecord();
    if (!record) return 300; // 5 minutes default
    return record + 30;
  };

  // Calculate PVP stats
  const getPVPStats = () => {
    const pvpGames = JSON.parse(localStorage.getItem('wc-timer-pvp-games') || '[]');
    const userGames = pvpGames.filter((game: PVPGame) => game.player_id === user?.id);
    const wins = userGames.filter((game: PVPGame) => game.winner_id === user?.id).length;
    const total = userGames.length;
    return { wins, total, winRate: total > 0 ? Math.round((wins / total) * 100) : 0 };
  };

  // Calculate daily performance
  const getDailyPerformance = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });
    
    const todayKaki = todaySessions.reduce((total, session) => total + (session.kaki_earned || 0), 0);
    const yesterdayKaki = kakiCount - todayKaki; // Simplified calculation
    
    return {
      today: todayKaki,
      yesterday: yesterdayKaki,
      change: todayKaki - yesterdayKaki
    };
  };

  const handleProgressResponse = (continueWorking: boolean) => {
    setShowProgressCheck(false);
    setLastProgressCheck(new Date());
    
    if (!continueWorking) {
      handleStopTimer();
    }
  };

  // Progress check every 20 minutes
  useEffect(() => {
    if (isRunning && seconds > 0 && seconds % 1200 === 0) { // 20 minutes = 1200 seconds
      const now = new Date();
      if (!lastProgressCheck || (now.getTime() - lastProgressCheck.getTime()) > 60000) { // 1 minute cooldown
        setShowProgressCheck(true);
      }
    }
  }, [isRunning, seconds, lastProgressCheck]);

  const pvpStats = getPVPStats();
  const dailyPerformance = getDailyPerformance();
  const nextGoal = getNextGoal();

  return (
    <div className="space-y-6 pb-20 pt-4">
      {/* Timer Display */}
      <Card className="p-6 border-2 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="text-center space-y-4">
          {/* Timer */}
          <div className="space-y-2">
            <div className="text-4xl sm:text-5xl font-mono font-bold text-primary">
              {formatTime(seconds)}
            </div>
          </div>

          {/* Earnings Display - Always show to maintain consistent height */}
          <div className="space-y-2">
            {isRunning ? (
              <>
                <div className="text-sm text-muted-foreground">
                  💰 Kerestél eddig:
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-success animate-bounce-in">
                  +{formatMoney(currentEarnings)} Ft
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  💰 Potenciális kereset:
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-muted-foreground">
                  +0 Ft
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Control Buttons */}
      <div className="space-y-4">
        {!isRunning ? (
          <Button
            onClick={handleStartTimer}
            size="xl"
            variant="fun"
            className="w-full text-lg sm:text-2xl animate-wiggle"
          >
            <Play className="w-6 h-6 sm:w-8 sm:h-8 mr-2" />
            Kakilás Start! 🚀
          </Button>
        ) : (
          <>
            <Button
              onClick={handleStopTimer}
              size="xl"
              variant="destructive"
              className="w-full text-lg sm:text-2xl"
            >
              <Square className="w-6 h-6 sm:w-8 sm:h-8 mr-2" />
              Befejezés 🏁
            </Button>
            
            {user && (
              <Button
                onClick={onNavigateToGames}
                size="lg"
                variant="outline"
                className="w-full text-sm sm:text-base"
              >
                <Sword className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                ⚔️ PVP Harc Játszás
              </Button>
            )}
          </>
        )}
      </div>

      {/* Personal Dashboard Cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* Daily Timer Sessions Card */}
        <Card className={`p-4 border-2 hover:shadow-lg transition-shadow ${getDailySessionsBorderColor()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-semibold truncate">💩 Napi Kaki Számláló</div>
                <div className="text-xl sm:text-2xl font-bold text-amber-600 truncate">
                  {dailyStats.dailyTimerSessions} kaki
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                  Ma hányszor indítottam el a timert
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-xs sm:text-sm text-muted-foreground">Mai</div>
              <div className="text-xs text-amber-600">Sessions</div>
            </div>
          </div>
        </Card>

        {/* PVP Win Rate Card */}
        <Card 
          className={`p-4 border-2 cursor-pointer hover:shadow-lg transition-shadow active:scale-95 ${getPVPWinRateBorderColor()}`}
          onClick={() => {
            if (!user) {
              onOpenAuth();
            } else if (onOpenPVPGame) {
              onOpenPVPGame();
            } else {
              onNavigateToGames?.();
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Sword className="w-6 h-6 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-semibold truncate">⚔️ PVP Win Rate</div>
                <div className="text-xl sm:text-2xl font-bold text-red-600 truncate">
                  {dailyStats.pvpWinRate}%
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                  {dailyStats.pvpWins}/{dailyStats.pvpTotal} győzelem (all-time)
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-xs sm:text-sm text-muted-foreground">Kattints</div>
              <div className="text-xs text-red-600">PVP Harc</div>
            </div>
          </div>
        </Card>

        {/* Daily Gift Box Card */}
        <Card 
          className={`p-4 border-2 transition-shadow ${getGiftBoxBorderColor()} ${
            dailyStats.canOpenGift 
              ? 'cursor-pointer hover:shadow-lg active:scale-95 bg-gradient-to-r from-purple-50 to-pink-50' 
              : 'cursor-not-allowed bg-gray-50'
          }`}
          onClick={dailyStats.canOpenGift ? handleOpenGift : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                dailyStats.canOpenGift 
                  ? 'bg-purple-100 animate-pulse' 
                  : 'bg-gray-100'
              }`}>
                <Gift className={`w-6 h-6 ${
                  dailyStats.canOpenGift 
                    ? 'text-purple-600' 
                    : 'text-gray-400'
                }`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-semibold truncate">
                  🎁 {dailyStats.canOpenGift ? 'Napi Ajándék' : 'Ajándék Kinyitva'}
                </div>
                <div className={`text-xl sm:text-2xl font-bold truncate ${
                  dailyStats.canOpenGift 
                    ? 'text-purple-600' 
                    : 'text-gray-400'
                }`}>
                  {dailyStats.canOpenGift ? '1-25 kaki' : 'Holnap újra!'}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                  {dailyStats.canOpenGift 
                    ? 'Kattints a kinyitáshoz!' 
                    : 'Holnap 00:00-kor újra'}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-xs sm:text-sm text-muted-foreground">
                {dailyStats.canOpenGift ? 'Kattints' : 'Várj'}
              </div>
              <div className={`text-xs ${
                dailyStats.canOpenGift 
                  ? 'text-purple-600' 
                  : 'text-gray-400'
              }`}>
                {dailyStats.canOpenGift ? 'Meglepetés!' : 'Holnapig'}
              </div>
            </div>
          </div>
        </Card>

        {/* Login Streak Card */}
        <Card className="p-4 border-2 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-semibold truncate">🔥 Bejelentkezési Sorozat</div>
                <div className="text-xl sm:text-2xl font-bold text-orange-600 truncate">
                  {dailyStats.loginStreak} nap
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                  Rekord: {dailyStats.longestStreak} nap
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-xs sm:text-sm text-muted-foreground">Jelenlegi</div>
              <div className="text-xs text-orange-600">Sorozat</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      {getRecentActivity().length > 0 && (
        <Card className="p-4 border-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Legutóbbi tevékenységek
            </h3>
          </div>
          <div className="space-y-2">
            {getRecentActivity().map((session, index) => (
              <div key={session.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>{formatTime(session.duration)}</span>
                </div>
                <div className="text-success font-medium">
                  +{formatMoney(session.earnedMoney)} Ft
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Progress Check Dialog */}
      <Dialog open={showProgressCheck} onOpenChange={setShowProgressCheck}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              🤔 Nyomod még?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="text-center text-muted-foreground">
              20 perc eltelt... Minden rendben? 😅
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleProgressResponse(true)}
                variant="success"
                size="lg"
                className="w-full"
              >
                Igen, folytatom! 👍
              </Button>
              <Button
                onClick={() => handleProgressResponse(false)}
                variant="destructive"
                size="lg"
                className="w-full"
              >
                Befejezem 🏁
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 