import { Card } from '@/components/ui/card';
import { Sword, Trophy, TrendingUp, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import type { PVPStats } from '@/types/statistics';

interface PVPDashboardProps {
  stats: PVPStats;
}

export function PVPDashboard({ stats }: PVPDashboardProps) {
  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  const formatCPS = (value: number) => {
    return `${value.toFixed(1)} CPS`;
  };

  // Win/Loss data for pie chart
  const winLossData = [
    { name: 'Győzelmek', value: stats.wins, color: '#22c55e' },
    { name: 'Veszteségek', value: stats.losses, color: '#ef4444' }
  ];

  // Weekly performance data
  const weeklyData = stats.weeklyStats.map(week => ({
    week: week.week,
    matches: week.matches,
    wins: week.wins,
    averageCPS: week.averageCPS,
    kakiEarned: week.kakiEarned
  }));

  // CPS progression data
  const cpsData = stats.recentMatches.slice(-10).map((match, index) => ({
    match: index + 1,
    cps: match.cps,
    result: match.result
  }));

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center border-2">
          <div className="text-2xl font-bold text-primary">
            {stats.totalMatches}
          </div>
          <div className="text-sm text-muted-foreground">Összes Meccs</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-2xl font-bold text-green-600">
            {formatPercentage(stats.winRate)}
          </div>
          <div className="text-sm text-muted-foreground">Győzelmi Arány</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-2xl font-bold text-blue-600">
            {formatCPS(stats.bestCPS)}
          </div>
          <div className="text-sm text-muted-foreground">Legjobb CPS</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-2xl font-bold text-yellow-600">
            +{stats.kakiEarned}
          </div>
          <div className="text-sm text-muted-foreground">Kaki Nyereség</div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Win/Loss Distribution */}
        <Card className="p-6 border-2">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold">Győzelmek/Veszteségek</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={winLossData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {winLossData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Győzelmek: {stats.wins}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">Veszteségek: {stats.losses}</span>
            </div>
          </div>
        </Card>

        {/* CPS Progression */}
        <Card className="p-6 border-2">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold">CPS Fejlődés</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={cpsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="match" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} CPS`, 'CPS']} />
              <Line 
                type="monotone" 
                dataKey="cps" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Weekly Performance */}
      <Card className="p-6 border-2">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-semibold">Heti Teljesítmény</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="matches" fill="#3b82f6" name="Meccsek" />
            <Bar dataKey="wins" fill="#22c55e" name="Győzelmek" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Detailed Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center border-2">
          <div className="text-xl font-bold">{formatCPS(stats.averageCPS)}</div>
          <div className="text-sm text-muted-foreground">Átlagos CPS</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-xl font-bold">{stats.bestClickRecord}</div>
          <div className="text-sm text-muted-foreground">Legjobb Kattintás</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-xl font-bold text-red-600">
            -{stats.kakiLost}
          </div>
          <div className="text-sm text-muted-foreground">Kaki Veszteség</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-xl font-bold">
            {stats.totalMatches > 0 ? (stats.kakiEarned / stats.totalMatches).toFixed(1) : 0}
          </div>
          <div className="text-sm text-muted-foreground">Kaki/Meccs</div>
        </Card>
      </div>

      {/* Recent Matches */}
      <Card className="p-6 border-2">
        <div className="flex items-center gap-3 mb-4">
          <Sword className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold">Legutóbbi Meccsek</h3>
        </div>
        <div className="space-y-3">
          {stats.recentMatches.slice(0, 5).map((match) => (
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