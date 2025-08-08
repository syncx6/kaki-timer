import { useState, useEffect } from 'react';
import { Header } from '@/components/navigation/Header';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { HomePage } from '@/components/pages/HomePage';
import { GamesPage } from '@/components/pages/GamesPage';
import { SocialPage } from '@/components/pages/SocialPage';
import { ProfilePage } from '@/components/pages/ProfilePage';
import { Auth } from '@/components/Auth';
import { Statistics } from '@/components/Statistics';
import { PVPGame } from '@/components/PVPGame';
import { useNotifications } from '@/hooks/use-notifications';
import { useAchievements } from '@/hooks/use-achievements';
import { useSwipeGesture } from '@/hooks/use-swipe-gesture';
import { SwipeIndicator } from '@/components/SwipeIndicator';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface TimerSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  earnedMoney: number;
  kaki_earned: number;
  username: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'games' | 'social' | 'profile'>('home');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showPVPGame, setShowPVPGame] = useState(false);
  const [salary, setSalary] = useState(550000);
  const [workHours, setWorkHours] = useState(180);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState<string>('');
  const [kakiCount, setKakiCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  
  // Timer state - moved to top level
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [showProgressCheck, setShowProgressCheck] = useState(false);
  const [lastProgressCheck, setLastProgressCheck] = useState<Date | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const { toast } = useToast();

  // New hooks
  const notifications = useNotifications();
  const achievements = useAchievements(user);

  // Navigation order for swipe gestures
  const navOrder: Array<'home' | 'games' | 'social' | 'profile'> = ['home', 'games', 'social', 'profile'];

  const handleSwipeLeft = () => {
    const currentIndex = navOrder.indexOf(activeTab);
    // Only move to next if not at the end
    if (currentIndex < navOrder.length - 1) {
      setSlideDirection('left');
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        setActiveTab(navOrder[nextIndex]);
        setSlideDirection(null);
      }, 150);
    }
  };

  const handleSwipeRight = () => {
    const currentIndex = navOrder.indexOf(activeTab);
    // Only move to previous if not at the beginning
    if (currentIndex > 0) {
      setSlideDirection('right');
      setTimeout(() => {
        const prevIndex = currentIndex - 1;
        setActiveTab(navOrder[prevIndex]);
        setSlideDirection(null);
      }, 150);
    }
  };

  // Swipe gesture hook
  const swipeRef = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    minSwipeDistance: 80,
    maxSwipeTime: 500
  });

  // Calculate hourly rate
  const hourlyRate = salary / workHours;
  const currentEarnings = Math.round((seconds / 3600) * hourlyRate);

  // Load settings from localStorage
  useEffect(() => {
    const savedSalary = localStorage.getItem('wc-timer-salary');
    const savedWorkHours = localStorage.getItem('wc-timer-work-hours');
    const savedUsername = localStorage.getItem('wc-timer-username');
    
    if (savedSalary) setSalary(parseFloat(savedSalary));
    if (savedWorkHours) setWorkHours(parseFloat(savedWorkHours));
    if (savedUsername) setUsername(savedUsername);
  }, []);

  // Load kaki count and total earnings when user changes
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          // Fetch kaki count
          const { data: profileData } = await supabase
            .from('profiles')
            .select('kaki_count')
            .eq('user_id', user.id)
            .single();
          
          setKakiCount(profileData?.kaki_count || 0);

          // Fetch total earnings from timer sessions
          const { data: sessionsData } = await supabase
            .from('timer_sessions')
            .select('earned_money')
            .eq('user_id', user.id);

          const total = sessionsData?.reduce((sum, session) => sum + (session.earned_money || 0), 0) || 0;
          setTotalEarnings(total);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
      fetchUserData();
    }
  }, [user]);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wc-timer-sessions');
    if (saved) {
      const parsed = JSON.parse(saved).map((s: TimerSession) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
      }));
      setSessions(parsed);
    }
  }, []);

  // Check for ongoing timer session on mount
  useEffect(() => {
    const savedTimerState = localStorage.getItem('wc-timer-state');
    const startTimeStr = localStorage.getItem('wc-timer-start-time');
    
    if (savedTimerState && startTimeStr) {
      const timerState = JSON.parse(savedTimerState);
      const startTime = new Date(startTimeStr);
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      
      if (timerState.isRunning && elapsed > 0) {
        console.log('Restoring ongoing timer session:', elapsed, 'seconds');
        setIsRunning(true);
        setSeconds(elapsed);
      } else if (!timerState.isRunning) {
        // Timer was stopped, restore the stopped state
        setSeconds(timerState.seconds || 0);
        setIsRunning(false);
      } else {
        // Clear invalid data
        localStorage.removeItem('wc-timer-start-time');
        localStorage.removeItem('wc-timer-state');
      }
    }
  }, []); // Only run once on mount

  // Initialize Web Worker for background timing
  useEffect(() => {
    // Only create worker if it doesn't exist
    if (!worker) {
      const newWorker = new Worker(new URL('../workers/timer-worker.ts', import.meta.url), {
        type: 'module'
      });
      
      newWorker.onmessage = (e) => {
        const { type, elapsed } = e.data;
        
        switch (type) {
          case 'TICK':
            setSeconds(elapsed);
            break;
          case 'STARTED':
            console.log('Timer started in worker');
            break;
          case 'STOPPED':
            console.log('Timer stopped in worker');
            break;
          case 'TIME':
            setSeconds(elapsed);
            break;
        }
      };
      
      setWorker(newWorker);
    }
    
    // Cleanup function
    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, []); // Empty dependency array - only run once

  // Start/stop timer with worker
  useEffect(() => {
    if (worker) {
      if (isRunning) {
        console.log('Starting timer in worker');
        worker.postMessage({ type: 'START' });
      } else {
        console.log('Stopping timer in worker');
        worker.postMessage({ type: 'STOP' });
      }
    }
  }, [isRunning, worker]);

  // Sync timer state with worker on mount and when isRunning changes
  useEffect(() => {
    if (worker) {
      if (isRunning) {
        console.log('Syncing timer state with worker - requesting current time');
        worker.postMessage({ type: 'GET_TIME' });
      }
    }
  }, [worker, isRunning]); // Run when worker is available or running state changes

  // Save timer state to localStorage periodically (not on every second change)
  useEffect(() => {
    // Only save state changes for isRunning, not for every second tick
    const timerState = {
      isRunning,
      seconds,
      lastUpdate: new Date().toISOString()
    };
    localStorage.setItem('wc-timer-state', JSON.stringify(timerState));
  }, [isRunning]); // Only save when running state changes, not every second

  // Handle page visibility changes (background/foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page went to background');
        // Save current state when going to background
        if (isRunning) {
          const timerState = {
            isRunning,
            seconds,
            lastUpdate: new Date().toISOString()
          };
          localStorage.setItem('wc-timer-state', JSON.stringify(timerState));
        }
      } else {
        console.log('Page came to foreground');
        // Restore state when coming back from background
        const savedTimerState = localStorage.getItem('wc-timer-state');
        const startTimeStr = localStorage.getItem('wc-timer-start-time');
        
        if (savedTimerState && startTimeStr && isRunning) {
          const timerState = JSON.parse(savedTimerState);
          const startTime = new Date(startTimeStr);
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          
          if (timerState.isRunning && elapsed > 0) {
            console.log('Updating timer from background:', elapsed, 'seconds');
            setSeconds(elapsed);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, seconds]);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
          setUser(session.user);
          
          // Fetch user profile with retry
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };
    
    checkExistingSession();
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setSession(session);
          setUser(session.user);
          
          // Fetch user profile with retry
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 1000);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUsername('');
          setKakiCount(0);
          setTotalEarnings(0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, kaki_count')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Try to get username from localStorage as fallback
        const savedUsername = localStorage.getItem('wc-timer-username');
        if (savedUsername) {
          setUsername(savedUsername);
        }
      } else if (data) {
        setUsername(data.username || 'Felhasználó');
        setKakiCount(data.kaki_count || 0);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Try to get username from localStorage as fallback
      const savedUsername = localStorage.getItem('wc-timer-username');
      if (savedUsername) {
        setUsername(savedUsername);
      }
    }
  };

  const handleSaveSettings = (newSalary: number, newWorkHours: number, newUsername: string) => {
    setSalary(newSalary);
    setWorkHours(newWorkHours);
    setUsername(newUsername);
    
    localStorage.setItem('wc-timer-salary', newSalary.toString());
    localStorage.setItem('wc-timer-work-hours', newWorkHours.toString());
    localStorage.setItem('wc-timer-username', newUsername);
  };

  const handleKakiUpdate = (change: number) => {
    console.log('Kaki update received:', change);
    setKakiCount(prev => {
      const newCount = prev + change;
      console.log('Kaki count updated from', prev, 'to', newCount);
      return newCount;
    });
    
    // Refresh stats if available
    if (typeof window !== 'undefined' && (window as any).refreshStats) {
      setTimeout(() => {
        (window as any).refreshStats();
      }, 100);
    }
  };

  const handleStartTimer = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    
    // Only start if not already running
    if (!isRunning) {
      const startTime = new Date();
      setIsRunning(true);
      setSeconds(0); // Reset seconds to 0 when starting
      
      // Save start time and state to localStorage
      localStorage.setItem('wc-timer-start-time', startTime.toISOString());
      localStorage.setItem('wc-timer-state', JSON.stringify({
        isRunning: true,
        seconds: 0,
        lastUpdate: startTime.toISOString()
      }));
      
      console.log('Timer started manually at:', startTime.toISOString());
      
      toast({
        title: "🚀 Időmérés elindítva!",
        description: "Kezdj el dolgozni és figyeld a pénzt! 💰",
      });
    }
  };

  const handleStopTimer = async () => {
    if (!user) return;
    
    // Only stop if currently running
    if (isRunning) {
      setIsRunning(false);
      const endTime = new Date();
      const startTimeStr = localStorage.getItem('wc-timer-start-time');
      
      if (startTimeStr) {
        const startTime = new Date(startTimeStr);
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        const earnedMoney = (duration / 3600) * hourlyRate;
        
        // Calculate kaki earned based on duration
        let kakiEarned = 0;
        if (duration >= 45 * 60) { // 45+ minutes
          kakiEarned = 10;
        } else if (duration >= 40 * 60) { // 40-44:59 minutes
          kakiEarned = 9;
        } else if (duration >= 35 * 60) { // 35-39:59 minutes
          kakiEarned = 8;
        } else if (duration >= 30 * 60) { // 30-34:59 minutes
          kakiEarned = 7;
        } else if (duration >= 25 * 60) { // 25-29:59 minutes
          kakiEarned = 6;
        } else if (duration >= 20 * 60) { // 20-24:59 minutes
          kakiEarned = 5;
        } else if (duration >= 15 * 60) { // 15-19:59 minutes
          kakiEarned = 4;
        } else if (duration >= 10 * 60) { // 10-14:59 minutes
          kakiEarned = 3;
        } else if (duration >= 5 * 60) { // 5-9:59 minutes
          kakiEarned = 2;
        } else if (duration >= 60) { // 1-4:59 minutes
          kakiEarned = 1;
        }
        
        // Save to Supabase
        try {
          const { error } = await supabase
            .from('timer_sessions')
            .insert({
              user_id: user.id,
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
              duration: duration,
              earned_money: earnedMoney,
              kaki_earned: kakiEarned,
              salary: salary,
              work_hours: workHours
            });
          
          if (error) {
            console.error('Error saving session to Supabase:', error);
          } else {
            console.log('Session saved to Supabase successfully');
            
            // Update total earnings
            setTotalEarnings(prev => prev + earnedMoney);
          }
          
          // Update kaki count in Supabase
          try {
            const { error } = await supabase
              .from('profiles')
              .update({ kaki_count: kakiCount + kakiEarned })
              .eq('user_id', user.id);
            
            if (error) {
              console.error('Error updating kaki count:', error);
            } else {
              setKakiCount(prev => prev + kakiEarned);
            }
          } catch (error) {
            console.error('Error updating kaki count:', error);
          }
        } catch (error) {
          console.error('Error saving session:', error);
        }
        
        // Send notification
        notifications.sendTimerCompletionNotification(
          Math.floor(duration / 60),
          Math.round(earnedMoney),
          kakiEarned
        );
        
        // Show success message
        toast({
          title: `🏁 Időmérés befejezve!`,
          description: `Kerestél ${formatMoney(earnedMoney)} Ft-ot és nyertél ${kakiEarned} kaki-t! 💩`,
        });
      }
      
      // Clear start time and update state
      localStorage.removeItem('wc-timer-start-time');
      localStorage.setItem('wc-timer-state', JSON.stringify({
        isRunning: false,
        seconds: 0,
        lastUpdate: new Date().toISOString()
      }));
      
      // Reset seconds to 0 after stopping
      setSeconds(0);
      
      console.log('Timer stopped manually');
    }
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

  const handleAuthSuccess = () => {
    setShowAuth(false);
    // Refresh username from localStorage immediately after auth
    const savedUsername = localStorage.getItem('wc-timer-username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            salary={salary}
            workHours={workHours}
            user={user}
            username={username}
            isRunning={isRunning}
            seconds={seconds}
            currentEarnings={currentEarnings}
            kakiCount={kakiCount}
            totalEarnings={totalEarnings}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            onOpenSettings={() => setActiveTab('profile')}
            onOpenStats={() => setShowStats(true)}
            onOpenAuth={() => setShowAuth(true)}
            onLogout={handleLogout}
            onKakiUpdate={handleKakiUpdate}
            onNavigateToGames={() => setActiveTab('games')}
            onOpenPVPGame={() => setShowPVPGame(true)}
          />
        );
      case 'games':
        return (
          <GamesPage
            user={user}
            username={username}
            onKakiUpdate={handleKakiUpdate}
          />
        );
      case 'social':
        return (
          <SocialPage
            user={user}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            user={user}
            username={username}
            salary={salary}
            workHours={workHours}
            onOpenSettings={() => {}} // Handled within ProfilePage
            onOpenStats={() => {}} // Handled within ProfilePage
            onOpenAuth={() => setShowAuth(true)}
            onLogout={handleLogout}
            onSaveSettings={handleSaveSettings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/10">
      {/* Header */}
      <Header
        username={username}
        kakiCount={kakiCount}
        isRunning={isRunning}
        seconds={seconds}
        activeTab={activeTab}
        onLogout={handleLogout}
        onOpenStats={() => setShowStats(true)}
        onOpenAuth={() => setShowAuth(true)}
        user={user}
      />

      {/* Main Content */}
      <div className="pt-14 pb-20 px-4">
        <div ref={swipeRef} className="max-w-md mx-auto swipe-container">
          <div className={`swipe-content ${
            slideDirection === 'left' ? 'slide-left' : 
            slideDirection === 'right' ? 'slide-right' : ''
          }`}>
            {renderActiveTab()}
          </div>
        </div>
        
        {/* Swipe Indicator */}
        <div className="max-w-md mx-auto">
          <SwipeIndicator 
            currentIndex={navOrder.indexOf(activeTab)}
            totalItems={navOrder.length}
            labels={['Főoldal', 'Játékok', 'Közösség', 'Profil']}
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Auth Dialog */}
      <Auth
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Statistics Dialog */}
      <Statistics
        open={showStats}
        onClose={() => setShowStats(false)}
        user={user}
      />

      {/* PVP Game Dialog */}
      <PVPGame
        open={showPVPGame}
        onClose={() => setShowPVPGame(false)}
        user={user}
        username={username}
        onKakiUpdate={handleKakiUpdate}
      />
    </div>
  );
};

export default Index;
