export interface PVPStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  bestCPS: number;
  averageCPS: number;
  bestClickRecord: number;
  kakiEarned: number;
  kakiLost: number;
  weeklyStats: WeeklyPVPStats[];
  recentMatches: PVPMatch[];
}

export interface WeeklyPVPStats {
  week: string;
  matches: number;
  wins: number;
  averageCPS: number;
  kakiEarned: number;
}

export interface PVPMatch {
  id: string;
  opponent: string;
  result: 'win' | 'loss';
  clicks: number;
  cps: number;
  kakiChange: number;
  date: Date;
}

export interface TimerStats {
  totalSessions: number;
  totalTime: number; // in seconds
  averageTime: number; // in seconds
  bestTime: number; // in seconds
  kakiEarned: number;
  categories: {
    short: number; // 1-5 min
    medium: number; // 5-15 min
    long: number; // 15+ min
  };
  dailyActivity: DailyActivity[];
  recentSessions: TimerSession[];
}

export interface DailyActivity {
  date: string;
  sessions: number;
  totalTime: number;
  kakiEarned: number;
}

export interface TimerSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  kakiEarned: number;
  category: 'short' | 'medium' | 'long';
}

export interface OverviewStats {
  totalKaki: number;
  pvpStats: PVPStats;
  timerStats: TimerStats;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
} 