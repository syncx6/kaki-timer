import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from './use-notifications';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'timer' | 'pvp' | 'social' | 'special';
  requirement_type: 'sessions' | 'time' | 'kaki' | 'wins' | 'clicks';
  requirement_value: number;
  reward_kaki: number;
  unlocked: boolean;
  progress: number;
  progress_percentage: number;
}

export interface UserStats {
  total_sessions: number;
  total_time: number;
  total_kaki: number;
  pvp_wins: number;
  pvp_total: number;
  best_clicks: number;
  current_streak: number;
  longest_streak: number;
}

export function useAchievements(user: SupabaseUser | null) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    total_sessions: 0,
    total_time: 0,
    total_kaki: 0,
    pvp_wins: 0,
    pvp_total: 0,
    best_clicks: 0,
    current_streak: 0,
    longest_streak: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const { sendAchievementNotification } = useNotifications();

  // Fetch achievements and user stats
  const fetchAchievements = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch achievements from database (or use default ones for now)
      const defaultAchievements: Achievement[] = [
        {
          id: 'first_session',
          title: 'Első Kakilás',
          description: 'Végezz el az első időmérő munkamenetet',
          icon: '🚽',
          category: 'timer',
          requirement_type: 'sessions',
          requirement_value: 1,
          reward_kaki: 5,
          unlocked: false,
          progress: 0,
          progress_percentage: 0
        },
        {
          id: 'session_master',
          title: 'Kakilás Mester',
          description: 'Végezz el 10 időmérő munkamenetet',
          icon: '👑',
          category: 'timer',
          requirement_type: 'sessions',
          requirement_value: 10,
          reward_kaki: 20,
          unlocked: false,
          progress: 0,
          progress_percentage: 0
        },
        {
          id: 'time_tour',
          title: 'Idő Túra',
          description: 'Tölts el összesen 1 órát kakilással',
          icon: '⏰',
          category: 'timer',
          requirement_type: 'time',
          requirement_value: 3600,
          reward_kaki: 50,
          unlocked: false,
          progress: 0,
          progress_percentage: 0
        },
        {
          id: 'kaki_collector',
          title: 'Kaki Gyűjtő',
          description: 'Gyűjts össze 100 kakit',
          icon: '💩',
          category: 'timer',
          requirement_type: 'kaki',
          requirement_value: 100,
          reward_kaki: 100,
          unlocked: false,
          progress: 0,
          progress_percentage: 0
        },
        {
          id: 'pvp_novice',
          title: 'PVP Újonc',
          description: 'Játsz az első PVP meccsed',
          icon: '⚔️',
          category: 'pvp',
          requirement_type: 'wins',
          requirement_value: 1,
          reward_kaki: 10,
          unlocked: false,
          progress: 0,
          progress_percentage: 0
        },
        {
          id: 'pvp_warrior',
          title: 'PVP Harcos',
          description: 'Nyerj 10 PVP meccset',
          icon: '🏆',
          category: 'pvp',
          requirement_type: 'wins',
          requirement_value: 10,
          reward_kaki: 50,
          unlocked: false,
          progress: 0,
          progress_percentage: 0
        },
        {
          id: 'click_master',
          title: 'Kattintás Mester',
          description: 'Érj el 100 kattintást egy meccsben',
          icon: '🎯',
          category: 'pvp',
          requirement_type: 'clicks',
          requirement_value: 100,
          reward_kaki: 30,
          unlocked: false,
          progress: 0,
          progress_percentage: 0
        }
      ];

      // Fetch user stats from localStorage and database
      const userStats = await calculateUserStats();
      setUserStats(userStats);

      // Calculate achievement progress
      const achievementsWithProgress = defaultAchievements.map(achievement => {
        const progress = calculateProgress(achievement, userStats);
        const progressPercentage = Math.min((progress / achievement.requirement_value) * 100, 100);
        const unlocked = progress >= achievement.requirement_value;

        return {
          ...achievement,
          progress,
          progress_percentage: progressPercentage,
          unlocked
        };
      });

      setAchievements(achievementsWithProgress);

      // Check for newly unlocked achievements
      checkNewAchievements(achievementsWithProgress);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate user stats
  const calculateUserStats = async (): Promise<UserStats> => {
    if (!user) return userStats;

    try {
      // Get timer sessions from localStorage
      const sessions = JSON.parse(localStorage.getItem('wc-timer-sessions') || '[]');
      const totalSessions = sessions.length;
      const totalTime = sessions.reduce((sum: number, session: any) => sum + (session.duration || 0), 0);
      const totalKaki = sessions.reduce((sum: number, session: any) => sum + (session.kaki_earned || 0), 0);

      // Get PVP games from localStorage
      const pvpGames = JSON.parse(localStorage.getItem('wc-timer-pvp-games') || '[]');
      const userGames = pvpGames.filter((game: any) => game.player_id === user.id);
      const pvpWins = userGames.filter((game: any) => game.winner_id === user.id).length;
      const pvpTotal = userGames.length;

      // Calculate best clicks
      const bestClicks = Math.max(...userGames.map((game: any) => game.player_clicks || 0), 0);

      // Calculate streaks (simplified)
      const currentStreak = 0; // TODO: Implement streak calculation
      const longestStreak = 0; // TODO: Implement streak calculation

      return {
        total_sessions: totalSessions,
        total_time: totalTime,
        total_kaki: totalKaki,
        pvp_wins: pvpWins,
        pvp_total: pvpTotal,
        best_clicks: bestClicks,
        current_streak: currentStreak,
        longest_streak: longestStreak
      };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      return userStats;
    }
  };

  // Calculate progress for an achievement
  const calculateProgress = (achievement: Achievement, stats: UserStats): number => {
    switch (achievement.requirement_type) {
      case 'sessions':
        return stats.total_sessions;
      case 'time':
        return stats.total_time;
      case 'kaki':
        return stats.total_kaki;
      case 'wins':
        return stats.pvp_wins;
      case 'clicks':
        return stats.best_clicks;
      default:
        return 0;
    }
  };

  // Check for newly unlocked achievements
  const checkNewAchievements = (currentAchievements: Achievement[]) => {
    const newlyUnlocked = currentAchievements.filter(achievement => 
      achievement.unlocked && 
      !achievements.find(a => a.id === achievement.id)?.unlocked
    );

    newlyUnlocked.forEach(achievement => {
      // Send notification
      sendAchievementNotification(achievement.title, achievement.description);

      // Add kaki reward
      if (user) {
        // TODO: Update kaki count in database
        console.log(`Achievement unlocked: ${achievement.title} - +${achievement.reward_kaki} kaki`);
      }
    });
  };

  // Update achievements when user stats change
  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  // Refresh achievements periodically
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        fetchAchievements();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  return {
    achievements,
    userStats,
    isLoading,
    fetchAchievements
  };
} 