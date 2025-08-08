import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Square, Clock, DollarSign, Trophy, TrendingUp, Sword, Target, Zap, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  onOpenPVPGame
}: HomePageProps) {
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [showProgressCheck, setShowProgressCheck] = useState(false);
  const [lastProgressCheck, setLastProgressCheck] = useState<Date | null>(null);
  const { toast } = useToast();

  // Load sessions from localStorage
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
  }, []);

  const handleStartTimer = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    onStartTimer();
  };

  const handleStopTimer = () => {
    onStopTimer();
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

      {/* Action-Oriented Quick Stats */}
      <div className="grid grid-cols-1 gap-4">
        {/* Next Goal Card */}
        <Card 
          className="p-4 border-2 cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
          onClick={handleStartTimer}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-semibold truncate">🎯 Következő Cél</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600 truncate">
                  {formatTime(nextGoal)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                  Rekord: {getRecord() ? formatTime(getRecord()!) : '--:--'}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-xs sm:text-sm text-muted-foreground">Kattints</div>
              <div className="text-xs text-blue-600">Új időmérés</div>
            </div>
          </div>
        </Card>

        {/* PVP Challenge Card */}
        <Card 
          className="p-4 border-2 cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
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
                <div className="text-lg font-semibold truncate">⚔️ PVP Kihívás</div>
                <div className="text-xl sm:text-2xl font-bold text-red-600 truncate">
                  {pvpStats.wins}/{pvpStats.total}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                  Win rate: {pvpStats.winRate}%
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-xs sm:text-sm text-muted-foreground">Kattints</div>
              <div className="text-xs text-red-600">CPU Harc</div>
            </div>
          </div>
        </Card>

        {/* Daily Performance Card */}
        <Card 
          className="p-4 border-2 cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
          onClick={onOpenStats}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-semibold truncate">🏆 Napi Teljesítmény</div>
                <div className="text-xl sm:text-2xl font-bold text-yellow-600 truncate">
                  +{dailyPerformance.today}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                  Ma: +{dailyPerformance.today}, Tegnap: +{dailyPerformance.yesterday}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-xs sm:text-sm text-muted-foreground">Kattints</div>
              <div className="text-xs text-yellow-600">Statisztikák</div>
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