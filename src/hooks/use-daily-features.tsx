import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface DailyStats {
  dailyTimerSessions: number;
  loginStreak: number;
  longestStreak: number;
  pvpWins: number;
  pvpTotal: number;
  pvpWinRate: number;
  canOpenGift: boolean;
  lastGiftDate: string | null;
}

interface GiftResult {
  kakiAmount: number;
  success: boolean;
  message: string;
}

export function useDailyFeatures(user: User | null) {
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    dailyTimerSessions: 0,
    loginStreak: 0,
    longestStreak: 0,
    pvpWins: 0,
    pvpTotal: 0,
    pvpWinRate: 0,
    canOpenGift: true,
    lastGiftDate: null
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Fetch daily stats from database
  const fetchDailyStats = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          daily_timer_sessions,
          login_streak,
          longest_streak,
          pvp_wins,
          pvp_total,
          pvp_win_rate,
          daily_gift_opened,
          last_gift_date,
          last_daily_reset,
          last_login_date
        `)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching daily stats:', error);
        return;
      }

      if (profile) {
        // Check if we need to reset daily counters
        const today = new Date().toISOString().split('T')[0];
        const lastReset = profile.last_daily_reset;
        const lastGift = profile.last_gift_date;
        
        let shouldReset = false;
        if (!lastReset || lastReset !== today) {
          shouldReset = true;
        }

        // Update login streak
        await updateLoginStreak(profile.last_login_date, profile.login_streak, profile.longest_streak);

        // Calculate real PVP stats from all sources
        const realPVPStats = await calculateRealPVPStats();

        setDailyStats({
          dailyTimerSessions: shouldReset ? 0 : profile.daily_timer_sessions || 0,
          loginStreak: profile.login_streak || 0,
          longestStreak: profile.longest_streak || 0,
          pvpWins: realPVPStats.wins,
          pvpTotal: realPVPStats.total,
          pvpWinRate: realPVPStats.winRate,
          canOpenGift: !profile.daily_gift_opened || lastGift !== today,
          lastGiftDate: profile.last_gift_date
        });

        // Reset daily counters if needed
        if (shouldReset) {
          await supabase
            .from('profiles')
            .update({
              daily_timer_sessions: 0,
              last_daily_reset: today,
              daily_gift_opened: false
            })
            .eq('user_id', user.id);
        }
      }
    } catch (error) {
      console.error('Error in fetchDailyStats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Calculate real PVP stats from all sources (localStorage + Supabase)
  const calculateRealPVPStats = async () => {
    if (!user) return { wins: 0, total: 0, winRate: 0 };

    try {
      // Get PVP data from Supabase
      const { data: supabasePVP } = await supabase
        .from('pvp_challenges')
        .select('*')
        .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`);

      // Get PVP data from localStorage
      const localStorageGames = JSON.parse(localStorage.getItem('wc-timer-pvp-games') || '[]');

      // Combine all PVP data
      const allPVPData = [
        ...(supabasePVP || []),
        ...localStorageGames.filter((game: any) => 
          game.player_id === user.id || game.opponent_id === user.id
        )
      ];

      let wins = 0;
      let total = allPVPData.length;

      // Count wins from all sources
      allPVPData.forEach((game: any) => {
        // Supabase data structure
        if (game.challenger_id && game.challenged_id) {
          if (game.winner_id === user.id) {
            wins++;
          }
        }
        // localStorage data structure
        else if (game.player_id && game.opponent_id) {
          const isPlayerWinner = game.player_clicks > game.opponent_clicks;
          if (game.player_id === user.id && isPlayerWinner) {
            wins++;
          } else if (game.opponent_id === user.id && !isPlayerWinner) {
            wins++;
          }
        }
      });

      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

      return { wins, total, winRate };
    } catch (error) {
      console.error('Error calculating PVP stats:', error);
      return { wins: 0, total: 0, winRate: 0 };
    }
  };

  // Update login streak
  const updateLoginStreak = async (lastLoginDate: string | null, currentStreak: number, longestStreak: number) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let newStreak = currentStreak || 0;
    let newLongestStreak = longestStreak || 0;

    if (!lastLoginDate || lastLoginDate === today) {
      // Already logged in today, no change needed
      return;
    } else if (lastLoginDate === yesterday) {
      // Consecutive day, increment streak
      newStreak += 1;
    } else {
      // Streak broken, reset to 1
      newStreak = 1;
    }

    // Update longest streak if current is higher
    if (newStreak > newLongestStreak) {
      newLongestStreak = newStreak;
    }

    // Update database
    await supabase
      .from('profiles')
      .update({
        login_streak: newStreak,
        longest_streak: newLongestStreak,
        last_login_date: today
      })
      .eq('user_id', user.id);

    // Update local state
    setDailyStats(prev => ({
      ...prev,
      loginStreak: newStreak,
      longestStreak: newLongestStreak
    }));
  };

  // Increment daily timer sessions counter
  const incrementDailyTimerSessions = async () => {
    if (!user) return;

    try {
      const newCount = dailyStats.dailyTimerSessions + 1;
      
      await supabase
        .from('profiles')
        .update({ daily_timer_sessions: newCount })
        .eq('user_id', user.id);

      setDailyStats(prev => ({
        ...prev,
        dailyTimerSessions: newCount
      }));
    } catch (error) {
      console.error('Error incrementing daily timer sessions:', error);
    }
  };

  // Open daily gift box
  const openDailyGift = async (): Promise<GiftResult> => {
    if (!user || !dailyStats.canOpenGift) {
      return {
        kakiAmount: 0,
        success: false,
        message: 'Már kinyitottad a mai ajándékot!'
      };
    }

    try {
      // Generate random kaki amount (1-25, weighted towards lower numbers)
      const kakiAmount = generateWeightedRandomKaki();
      const today = new Date().toISOString().split('T')[0];

      // Record the gift in daily_gifts table
      const { error: giftError } = await supabase
        .from('daily_gifts')
        .insert({
          user_id: user.id,
          gift_date: today,
          kaki_amount: kakiAmount
        });

      if (giftError) {
        console.error('Error recording gift:', giftError);
        return {
          kakiAmount: 0,
          success: false,
          message: 'Hiba történt az ajándék kinyitása közben!'
        };
      }

      // First get current kaki count
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('kaki_count')
        .eq('user_id', user.id)
        .single();

      const currentKaki = currentProfile?.kaki_count || 0;

      // Update profile to mark gift as opened and add kaki
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          daily_gift_opened: true,
          last_gift_date: today,
          kaki_count: currentKaki + kakiAmount
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return {
          kakiAmount: 0,
          success: false,
          message: 'Hiba történt az ajándék feldolgozása közben!'
        };
      }

      // Update local state
      setDailyStats(prev => ({
        ...prev,
        canOpenGift: false,
        lastGiftDate: today
      }));

      return {
        kakiAmount,
        success: true,
        message: `Gratulálok! ${kakiAmount} kaki jelvényt nyertél! 🎉`
      };
    } catch (error) {
      console.error('Error opening daily gift:', error);
      return {
        kakiAmount: 0,
        success: false,
        message: 'Váratlan hiba történt!'
      };
    }
  };

  // Generate weighted random kaki (1-25, favoring lower numbers)
  const generateWeightedRandomKaki = (): number => {
    const weights = [];
    
    // Create weighted array (higher weight = higher chance)
    // 1 kaki: 25% chance, 2 kaki: 20% chance, ..., 25 kaki: ~0.1% chance
    for (let i = 1; i <= 25; i++) {
      const weight = Math.max(1, Math.round(26 - i)); // 25, 24, 23, ..., 1
      for (let j = 0; j < weight; j++) {
        weights.push(i);
      }
    }
    
    // Pick random element from weighted array
    const randomIndex = Math.floor(Math.random() * weights.length);
    return weights[randomIndex];
  };

  // Update PVP stats after a match
  const updatePVPStats = async (won: boolean) => {
    if (!user) return;

    // Recalculate real PVP stats from all sources
    const realPVPStats = await calculateRealPVPStats();

    try {
      // Update database with real stats
      await supabase
        .from('profiles')
        .update({
          pvp_wins: realPVPStats.wins,
          pvp_total: realPVPStats.total,
          pvp_win_rate: realPVPStats.winRate
        })
        .eq('user_id', user.id);

      // Update local state with real stats
      setDailyStats(prev => ({
        ...prev,
        pvpWins: realPVPStats.wins,
        pvpTotal: realPVPStats.total,
        pvpWinRate: realPVPStats.winRate
      }));
    } catch (error) {
      console.error('Error updating PVP stats:', error);
    }
  };

  // Fetch stats on mount and user change
  useEffect(() => {
    fetchDailyStats();
  }, [fetchDailyStats]);

  return {
    dailyStats,
    isLoading,
    incrementDailyTimerSessions,
    openDailyGift,
    updatePVPStats,
    refreshStats: fetchDailyStats
  };
}