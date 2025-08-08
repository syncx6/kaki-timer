import { Card } from '@/components/ui/card';
import { Clock, Calendar, TrendingUp, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';
import type { TimerStats } from '@/types/statistics';

interface TimerDashboardProps {
  stats: TimerStats;
}

export function TimerDashboard({ stats }: TimerDashboardProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatKakiPerHour = (kaki: number, time: number) => {
    if (time === 0) return '0';
    const hours = time / 3600;
    return (kaki / hours).toFixed(1);
  };

  // Category distribution for pie chart
  const categoryData = [
    { name: 'Rövid (1-5 min)', value: stats.categories.short, color: '#22c55e' },
    { name: 'Közepes (5-15 min)', value: stats.categories.medium, color: '#f59e0b' },
    { name: 'Hosszú (15+ min)', value: stats.categories.long, color: '#ef4444' }
  ];

  // Daily activity data
  const dailyData = stats.dailyActivity.slice(-7).map(day => ({
    date: day.date,
    sessions: day.sessions,
    totalTime: day.totalTime / 3600, // Convert to hours
    kakiEarned: day.kakiEarned
  }));

  // Recent sessions data
  const recentData = stats.recentSessions.slice(-10).map((session, index) => ({
    session: index + 1,
    duration: session.duration / 60, // Convert to minutes
    kakiEarned: session.kakiEarned,
    category: session.category
  }));

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center border-2">
          <div className="text-2xl font-bold text-primary">
            {stats.totalSessions}
          </div>
          <div className="text-sm text-muted-foreground">Összes Kakilás</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-2xl font-bold text-blue-600">
            {formatTime(stats.totalTime)}
          </div>
          <div className="text-sm text-muted-foreground">Összes Idő</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-2xl font-bold text-green-600">
            {formatTime(stats.averageTime)}
          </div>
          <div className="text-sm text-muted-foreground">Átlagos Idő</div>
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
        {/* Category Distribution */}
        <Card className="p-6 border-2">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-purple-500" />
            <h3 className="text-lg font-semibold">Kakilás Kategóriák</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Rövid: {stats.categories.short}</span>
              </div>
              <span className="text-sm font-medium">{stats.categories.short} db</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Közepes: {stats.categories.medium}</span>
              </div>
              <span className="text-sm font-medium">{stats.categories.medium} db</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Hosszú: {stats.categories.long}</span>
              </div>
              <span className="text-sm font-medium">{stats.categories.long} db</span>
            </div>
          </div>
        </Card>

        {/* Duration Progression */}
        <Card className="p-6 border-2">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold">Idő Fejlődés</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={recentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="session" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} perc`, 'Idő']} />
              <Line 
                type="monotone" 
                dataKey="duration" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Daily Activity */}
      <Card className="p-6 border-2">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-green-500" />
          <h3 className="text-lg font-semibold">Napi Aktivitás</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="totalTime" 
              stroke="#22c55e" 
              fill="#22c55e" 
              fillOpacity={0.3}
              name="Idő (óra)"
            />
            <Area 
              type="monotone" 
              dataKey="kakiEarned" 
              stroke="#f59e0b" 
              fill="#f59e0b" 
              fillOpacity={0.3}
              name="Kaki"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Detailed Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center border-2">
          <div className="text-xl font-bold">{formatTime(stats.bestTime)}</div>
          <div className="text-sm text-muted-foreground">Legjobb Idő</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-xl font-bold">
            {formatKakiPerHour(stats.kakiEarned, stats.totalTime)}
          </div>
          <div className="text-sm text-muted-foreground">Kaki/Óra</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-xl font-bold">
            {stats.totalSessions > 0 ? (stats.kakiEarned / stats.totalSessions).toFixed(1) : 0}
          </div>
          <div className="text-sm text-muted-foreground">Kaki/Kakilás</div>
        </Card>
        
        <Card className="p-4 text-center border-2">
          <div className="text-xl font-bold">
            {stats.totalSessions > 0 ? Math.round(stats.totalTime / stats.totalSessions / 60) : 0}
          </div>
          <div className="text-sm text-muted-foreground">Átlag Perc</div>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card className="p-6 border-2">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-semibold">Legutóbbi Kakilások</h3>
        </div>
        <div className="space-y-3">
          {stats.recentSessions.slice(0, 5).map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  session.category === 'short' ? 'bg-green-500' : 
                  session.category === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="font-medium">{formatTime(session.duration)}</span>
                <span className="text-sm text-muted-foreground capitalize">
                  {session.category}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(session.startTime).toLocaleDateString('hu-HU')}
              </div>
              <div className="font-bold text-yellow-600">
                +{session.kakiEarned} 💩
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 