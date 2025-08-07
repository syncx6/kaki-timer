import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Square, Clock, DollarSign, Trophy, TrendingUp, Sword } from 'lucide-react';
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

interface HomePageProps {
  salary: number;
  workHours: number;
  user: SupabaseUser | null;
  username: string;
  isRunning: boolean;
  seconds: number;
  currentEarnings: number;
  onStartTimer: () => void;
  onStopTimer: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenAuth: () => void;
  onOpenOnlineLeaderboard: () => void;
  onLogout: () => void;
  onKakiUpdate?: (change: number) => void;
  onNavigateToGames?: () => void;
}

export function HomePage({ 
  salary, 
  workHours, 
  user, 
  username,
  isRunning,
  seconds,
  currentEarnings,
  onStartTimer,
  onStopTimer,
  onOpenSettings, 
  onOpenStats, 
  onOpenAuth, 
  onOpenOnlineLeaderboard, 
  onLogout,
  onKakiUpdate,
  onNavigateToGames
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
    return sessions.length > 0 ? Math.max(...sessions.map(s => s.duration)) : null;
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

  return (
    <div className="space-y-6 pb-20">
      {/* Timer Display */}
      <Card className="p-8 text-center shadow-fun border-2 min-h-[200px] flex items-center justify-center">
        <div className="space-y-4">
          <div className={`text-6xl font-black font-mono ${isRunning ? 'text-success animate-pulse' : 'text-primary'}`}>
            {formatTime(seconds)}
          </div>
          
          {isRunning && (
            <div className="text-2xl font-bold text-success animate-bounce-in">
              +{formatMoney(currentEarnings)} Ft
            </div>
          )}
        </div>
      </Card>

      {/* Control Buttons */}
      <div className="space-y-4">
        {!isRunning ? (
          <Button
            onClick={handleStartTimer}
            size="xl"
            variant="fun"
            className="w-full text-2xl animate-wiggle"
          >
            <Play className="w-8 h-8 mr-2" />
            Kakilás Start! 🚀
          </Button>
        ) : (
          <>
            <Button
              onClick={handleStopTimer}
              size="xl"
              variant="destructive"
              className="w-full text-2xl"
            >
              <Square className="w-8 h-8 mr-2" />
              Befejezés 🏁
            </Button>
            
            {user && (
              <Button
                onClick={onNavigateToGames}
                size="lg"
                variant="outline"
                className="w-full"
              >
                <Sword className="w-5 h-5 mr-2" />
                ⚔️ PVP Harc Játszás
              </Button>
            )}
          </>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center border-2">
          <div className="text-2xl font-bold text-primary">
            {getRecord() ? formatTime(getRecord()!) : '--:--'}
          </div>
          <div className="text-sm text-muted-foreground">Rekord idő 🏆</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-2xl font-bold text-success">
            {formatMoney(getTotalEarnings())} Ft
          </div>
          <div className="text-sm text-muted-foreground">Össz kereset 💰</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-2xl font-bold text-yellow-600">
            {sessions.reduce((total, session) => total + (session.kaki_earned || 0), 0)} 💩
          </div>
          <div className="text-sm text-muted-foreground">Össz kaki</div>
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