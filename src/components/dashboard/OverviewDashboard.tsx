import { Card } from '@/components/ui/card';
import { Trophy, Clock, Sword, TrendingUp } from 'lucide-react';
import type { OverviewStats } from '@/types/statistics';

interface OverviewDashboardProps {
  stats: OverviewStats;
}

export function OverviewDashboard({ stats }: OverviewDashboardProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  return (
    <div className="space-y-6 h-full">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center border-2">
          <div className="text-2xl font-bold text-primary">
            {stats.totalKaki} 💩
          </div>
          <div className="text-sm text-muted-foreground">Összes Kaki</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-2xl font-bold text-green-600">
            {formatPercentage(stats.pvpStats.winRate)}
          </div>
          <div className="text-sm text-muted-foreground">PVP Győzelmi Arány</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-2xl font-bold text-blue-600">
            {stats.timerStats.totalSessions}
          </div>
          <div className="text-sm text-muted-foreground">Kakilások</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-2xl font-bold text-purple-600">
            {formatTime(stats.timerStats.totalTime)}
          </div>
          <div className="text-sm text-muted-foreground">Összes Idő</div>
        </Card>
      </div>

      {/* PVP Summary */}
      <Card className="p-6 border-2">
        <div className="flex items-center gap-3 mb-4">
          <Sword className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold">PVP Harc Összefoglaló</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold">{stats.pvpStats.totalMatches}</div>
            <div className="text-sm text-muted-foreground">Meccsek</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{stats.pvpStats.wins}</div>
            <div className="text-sm text-muted-foreground">Győzelmek</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{stats.pvpStats.bestCPS.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Legjobb CPS</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-600">+{stats.pvpStats.kakiEarned}</div>
            <div className="text-sm text-muted-foreground">Kaki Nyereség</div>
          </div>
        </div>
      </Card>

      {/* Timer Summary */}
      <Card className="p-6 border-2">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-semibold">Kakilás Összefoglaló</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold">{formatTime(stats.timerStats.averageTime)}</div>
            <div className="text-sm text-muted-foreground">Átlagos Idő</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{formatTime(stats.timerStats.bestTime)}</div>
            <div className="text-sm text-muted-foreground">Legjobb Idő</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{stats.timerStats.categories.medium}</div>
            <div className="text-sm text-muted-foreground">Közepes Kakilás</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-600">+{stats.timerStats.kakiEarned}</div>
            <div className="text-sm text-muted-foreground">Kaki Nyereség</div>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6 border-2">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-semibold">Legutóbbi Tevékenységek</h3>
        </div>
        <div className="space-y-3">
          {stats.pvpStats.recentMatches.slice(0, 3).map((match) => (
            <div key={match.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${match.result === 'win' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">vs {match.opponent}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {match.clicks} kattintás ({match.cps.toFixed(1)} CPS)
              </div>
              <div className={`font-bold ${match.kakiChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {match.kakiChange > 0 ? '+' : ''}{match.kakiChange} 💩
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 