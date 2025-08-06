import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Trophy, Clock, DollarSign, Calendar, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TimerSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  earnedMoney: number;
}

interface StatisticsProps {
  open: boolean;
  onClose: () => void;
}

export function Statistics({ open, onClose }: StatisticsProps) {
  const [sessions, setSessions] = useState<TimerSession[]>([]);
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

  const clearAllData = () => {
    localStorage.removeItem('wc-timer-sessions');
    setSessions([]);
    toast({
      title: "🗑️ Adatok törölve",
      description: "Minden eddigi időmérés törölve lett!",
    });
  };

  const stats = getStats();
  const topSessions = getTopSessions();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            📊 Statisztikák
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Áttekintés</TabsTrigger>
            <TabsTrigger value="leaderboard">Top Lista</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 text-center border-2">
                <div className="text-2xl">🏆</div>
                <div className="text-lg font-bold text-primary">
                  {formatTime(stats.longestSession)}
                </div>
                <div className="text-xs text-muted-foreground">Rekord idő</div>
              </Card>

              <Card className="p-4 text-center border-2">
                <div className="text-2xl">💰</div>
                <div className="text-lg font-bold text-success">
                  {formatMoney(stats.totalEarnings)} Ft
                </div>
                <div className="text-xs text-muted-foreground">Össz kereset</div>
              </Card>

              <Card className="p-4 text-center border-2">
                <div className="text-2xl">⏱️</div>
                <div className="text-lg font-bold text-warning">
                  {formatTime(stats.totalTime)}
                </div>
                <div className="text-xs text-muted-foreground">Össz idő</div>
              </Card>

              <Card className="p-4 text-center border-2">
                <div className="text-2xl">📅</div>
                <div className="text-lg font-bold text-accent-foreground">
                  {stats.sessionsThisMonth}
                </div>
                <div className="text-xs text-muted-foreground">Ebben a hónapban</div>
              </Card>
            </div>

            <Card className="p-4 border-2">
              <div className="space-y-2">
                <h3 className="font-semibold text-center">📈 További adatok</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Átlag idő:</span>
                    <div className="font-semibold">{formatTime(stats.averageTime)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Össz alkalom:</span>
                    <div className="font-semibold">{stats.totalSessions} db</div>
                  </div>
                </div>
              </div>
            </Card>

            {sessions.length > 0 && (
              <Button
                onClick={clearAllData}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Összes adat törlése
              </Button>
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-primary mb-4">
                🏆 Legjobb Idők
              </h3>
            </div>

            {topSessions.length === 0 ? (
              <Card className="p-8 text-center border-2">
                <div className="text-4xl mb-2">🚽</div>
                <div className="text-muted-foreground">
                  Még nincs mért időd!<br />
                  Indítsd el az első mérést! 😄
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {topSessions.map((session, index) => (
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
                          <div className="text-xs text-muted-foreground">
                            {formatDate(session.startTime)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-success">
                          +{formatMoney(session.earnedMoney)} Ft
                        </div>
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