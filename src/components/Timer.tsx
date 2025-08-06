import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Square, Settings, BarChart3, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { UserStatusDropdown } from './UserStatusDropdown';

interface TimerSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  earnedMoney: number;
  kaki_earned?: number;
}

interface TimerProps {
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenAuth: () => void;
  onOpenOnlineLeaderboard: () => void;
  onLogout: () => void;
  salary: number;
  workHours: number;
  user: SupabaseUser | null;
  username: string;
}

export function Timer({ onOpenSettings, onOpenStats, onOpenAuth, onOpenOnlineLeaderboard, onLogout, salary, workHours, user, username }: TimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [showProgressCheck, setShowProgressCheck] = useState(false);
  const [lastProgressCheck, setLastProgressCheck] = useState<Date | null>(null);
  const [kakiCount, setKakiCount] = useState(0);
  const [worker, setWorker] = useState<Worker | null>(null);
  const { toast } = useToast();

  // Calculate hourly rate
  const hourlyRate = salary / workHours;
  const currentEarnings = (seconds / 3600) * hourlyRate;

  // Load sessions from localStorage and fetch kaki count
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

    // Fetch user's kaki count if logged in
    if (user) {
      const fetchKakiCount = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('kaki_count')
            .eq('user_id', user.id)
            .single();
          
          setKakiCount(data?.kaki_count || 0);
        } catch (error) {
          console.error('Error fetching kaki count:', error);
        }
      };
      fetchKakiCount();
    }
  }, [user]);

  // Save sessions to localStorage
  const saveSessions = useCallback((newSessions: TimerSession[]) => {
    localStorage.setItem('wc-timer-sessions', JSON.stringify(newSessions));
    setSessions(newSessions);
  }, []);

  // Initialize Web Worker for background timing
  useEffect(() => {
    const newWorker = new Worker(new URL('../workers/timer-worker.ts', import.meta.url), {
      type: 'module'
    });
    
    newWorker.onmessage = (e) => {
      const { type, elapsed } = e.data;
      
      switch (type) {
        case 'TICK':
          setSeconds(elapsed);
          break;
        case 'STOPPED':
          setSeconds(elapsed);
          break;
      }
    };
    
    setWorker(newWorker);
    
    return () => {
      newWorker.terminate();
    };
  }, []);

  // Timer effect using Web Worker
  useEffect(() => {
    if (!worker) return;
    
    if (isRunning) {
      worker.postMessage({ type: 'START' });
    } else {
      worker.postMessage({ type: 'STOP' });
    }
  }, [isRunning, worker]);

  // Progress check effect (every 20 minutes)
  useEffect(() => {
    if (!isRunning) return;

    const checkInterval = setInterval(() => {
      const now = new Date();
      if (!lastProgressCheck || now.getTime() - lastProgressCheck.getTime() >= 20 * 60 * 1000) {
        setShowProgressCheck(true);
        setLastProgressCheck(now);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [isRunning, lastProgressCheck]);

  // Auto-stop timer after 15 seconds of no response
  useEffect(() => {
    if (!showProgressCheck) return;

    const timeout = setTimeout(() => {
      handleStopTimer();
      setShowProgressCheck(false);
      toast({
        title: "⏰ Idő lejárt!",
        description: "15 másodperc után automatikusan leállt a timer.",
      });
    }, 15000);

    return () => clearTimeout(timeout);
  }, [showProgressCheck]);

  const handleStartTimer = () => {
    setIsRunning(true);
    setSeconds(0);
    setLastProgressCheck(new Date());
    toast({
      title: "🚽 Timer elindítva!",
      description: "Jó szórakozást! 💩",
    });
  };

  const handleStopTimer = async () => {
    const finalSeconds = seconds; // Store the final time before resetting
    if (finalSeconds > 0) {
      // Calculate kaki badges earned (1 per 10 minutes, max 5)
      const minutesElapsed = Math.floor(finalSeconds / 60);
      const kakiEarned = Math.min(Math.floor(minutesElapsed / 10) + 1, 5);

      const session: TimerSession = {
        id: Date.now().toString(),
        startTime: new Date(Date.now() - finalSeconds * 1000),
        endTime: new Date(),
        duration: finalSeconds,
        earnedMoney: (finalSeconds / 3600) * hourlyRate,
        kaki_earned: kakiEarned,
      };
      
      // Save to localStorage (offline)
      const newSessions = [session, ...sessions];
      saveSessions(newSessions);
      
      // Save to database if user is logged in
      if (user) {
        try {
          const { error } = await supabase.from('timer_sessions').insert({
            user_id: user.id,
            start_time: session.startTime.toISOString(),
            end_time: session.endTime.toISOString(),
            duration: session.duration,
            earned_money: session.earnedMoney,
            salary: salary,
            work_hours: workHours,
            kaki_earned: kakiEarned,
          });

          if (error) {
            console.error('Error saving to Supabase:', error);
          } else {
            // Get current kaki count and update it
            const { data: profile } = await supabase
              .from('profiles')
              .select('kaki_count')
              .eq('user_id', user.id)
              .single();
            
            const currentKakiCount = profile?.kaki_count || 0;
            const newKakiCount = currentKakiCount + kakiEarned;
            await supabase
              .from('profiles')
              .update({ kaki_count: newKakiCount })
              .eq('user_id', user.id);
            
            // Update local kaki count
            setKakiCount(newKakiCount);
          }
        } catch (error) {
          console.error('Error saving session to database:', error);
        }
      }
      
      toast({
        title: "✅ Idő mentve!",
        description: `${formatTime(finalSeconds)} alatt ${formatMoney((finalSeconds / 3600) * hourlyRate)} Ft-ot kerestél és ${kakiEarned} 💩 jelvényt szereztél!`,
        className: "fixed bottom-4 right-4 z-50",
        duration: 1000,
      });
    }
    
    setIsRunning(false);
    setSeconds(finalSeconds); // Keep the final time displayed
    setLastProgressCheck(null);
  };

  const handleProgressResponse = (continuing: boolean) => {
    setShowProgressCheck(false);
    if (!continuing) {
      handleStopTimer();
    } else {
      setLastProgressCheck(new Date());
      toast({
        title: "💪 Folytatjuk!",
        description: "Hajrá, még vagy benne! 🔥",
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/10 p-4">
      <UserStatusDropdown 
        username={username}
        kakiCount={kakiCount}
        onLogout={onLogout}
        onOpenStats={onOpenStats}
        user={user}
      />

      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 pt-8">
          <h1 className="text-4xl font-black text-primary animate-bounce-in">
            🚽 WC Timer
          </h1>
          <p className="text-muted-foreground font-medium">
            Keress pénzt kakálás közben! 💰💩
          </p>
        </div>

        {/* Timer Display */}
        <Card className="p-8 text-center shadow-fun border-2">
          <div className="space-y-4">
            <div className={`text-6xl font-black font-mono ${isRunning ? 'text-success animate-pulse' : 'text-primary'}`}>
              {formatTime(seconds)}
            </div>
            
            {isRunning && (
              <div className="space-y-2 animate-bounce-in">
                <div className="text-2xl font-bold text-success">
                  +{formatMoney(currentEarnings)} Ft
                </div>
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
            <Button
              onClick={handleStopTimer}
              size="xl"
              variant="destructive"
              className="w-full text-2xl"
            >
              <Square className="w-8 h-8 mr-2" />
              Befejezés 🏁
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Offline message when not logged in */}
        {!user && (
          <Card className="p-4 text-center border-2 cursor-pointer hover:bg-accent/50 transition-colors" onClick={onOpenAuth}>
            <div className="text-sm text-muted-foreground">
              Offline mód - adatok csak ezen az eszközön
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={onOpenSettings}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <Settings className="w-5 h-5 mr-2" />
            Beállítások
          </Button>
          
          <Button
            onClick={onOpenStats}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            Statisztikák
          </Button>
        </div>

        {/* Online Features */}
        {user && (
          <div className="space-y-4">
            <Button
              onClick={onOpenOnlineLeaderboard}
              variant="fun"
              size="lg"
              className="w-full"
            >
              <Globe className="w-5 h-5 mr-2" />
              🏆 Online Toplista
            </Button>
          </div>
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
                  ✅ Nyomom
                </Button>
                <Button
                  onClick={() => handleProgressResponse(false)}
                  variant="destructive"
                  size="lg"
                  className="w-full"
                >
                  ❌ Nem
                </Button>
              </div>
              <div className="text-xs text-center text-muted-foreground">
                15 másodperc múlva automatikusan leáll...
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}