import { useState, useEffect } from 'react';
import { Header } from '@/components/navigation/Header';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { HomePage } from '@/components/pages/HomePage';
import { GamesPage } from '@/components/pages/GamesPage';
import { SocialPage } from '@/components/pages/SocialPage';
import { ProfilePage } from '@/components/pages/ProfilePage';
import { Auth } from '@/components/Auth';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'games' | 'social' | 'profile'>('home');
  const [showAuth, setShowAuth] = useState(false);
  const [salary, setSalary] = useState(550000);
  const [workHours, setWorkHours] = useState(180);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState<string>('');
  const [kakiCount, setKakiCount] = useState(0);
  
  // Timer state - moved to top level
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showProgressCheck, setShowProgressCheck] = useState(false);
  const [lastProgressCheck, setLastProgressCheck] = useState<Date | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const { toast } = useToast();

  // Calculate hourly rate
  const hourlyRate = salary / workHours;
  const currentEarnings = (seconds / 3600) * hourlyRate;

  // Load settings from localStorage
  useEffect(() => {
    const savedSalary = localStorage.getItem('wc-timer-salary');
    const savedWorkHours = localStorage.getItem('wc-timer-work-hours');
    const savedUsername = localStorage.getItem('wc-timer-username');
    
    if (savedSalary) setSalary(parseFloat(savedSalary));
    if (savedWorkHours) setWorkHours(parseFloat(savedWorkHours));
    if (savedUsername) setUsername(savedUsername);
  }, []);

  // Load kaki count when user changes
  useEffect(() => {
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

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          // A felhasználónév megmarad offline módban is
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Ha nincs profil, várjunk egy kicsit és próbáljuk újra
        // Mert a regisztráció során létrehozzuk a profilt
        setTimeout(async () => {
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', userId)
            .single();

          if (!retryError && retryData) {
            setUsername(retryData.username);
            localStorage.setItem('wc-timer-username', retryData.username);
          } else {
            // Ha még mindig nincs profil, használjuk az email címet
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
              const fallbackUsername = userData.user.email?.split('@')[0] || 'Felhasználó';
              setUsername(fallbackUsername);
              localStorage.setItem('wc-timer-username', fallbackUsername);
            }
          }
        }, 1000); // Várjunk 1 másodpercet
        return;
      }
      
      console.log('Profile data:', data);
      // Mindig állítjuk be a felhasználónevet a profildból
      setUsername(data?.username || 'Felhasználó');
      localStorage.setItem('wc-timer-username', data?.username || 'Felhasználó');
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUsername('Felhasználó');
      localStorage.setItem('wc-timer-username', 'Felhasználó');
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
    setKakiCount(prev => Math.max(0, prev + change));
  };

  // Timer functions
  const handleStartTimer = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    setIsRunning(true);
    setSeconds(0);
    setLastProgressCheck(null);
    
    if (worker) {
      worker.postMessage({ type: 'START' });
    }
  };

  const handleStopTimer = async () => {
    // Store the final time before resetting
    const finalSeconds = seconds;
    
    // First, stop the timer and reset immediately
    setIsRunning(false);
    setSeconds(0);
    setLastProgressCheck(null);
    
    if (worker) {
      worker.postMessage({ type: 'STOP' });
    }

    // Calculate earnings
    const earnedMoney = (finalSeconds / 3600) * hourlyRate;
    
    // Calculate kaki rewards based on time ranges
    let kakiEarned = 0;
    if (finalSeconds <= 300) { // 0-5 minutes
      kakiEarned = 1;
    } else if (finalSeconds <= 599) { // 5:01-9:59
      kakiEarned = 2;
    } else if (finalSeconds <= 899) { // 10:00-14:59
      kakiEarned = 3;
    } else if (finalSeconds <= 1199) { // 15:00-19:59
      kakiEarned = 4;
    } else if (finalSeconds <= 1499) { // 20:00-24:59
      kakiEarned = 5;
    } else if (finalSeconds <= 1799) { // 25:00-29:59
      kakiEarned = 6;
    } else if (finalSeconds <= 2099) { // 30:00-34:59
      kakiEarned = 7;
    } else if (finalSeconds <= 2399) { // 35:00-39:59
      kakiEarned = 8;
    } else if (finalSeconds <= 2699) { // 40:00-44:59
      kakiEarned = 9;
    } else { // 45:00+
      kakiEarned = 10; // Maximum 10 kaki per session
    }

    // Create session
    const session = {
      id: Date.now().toString(),
      startTime: new Date(Date.now() - finalSeconds * 1000),
      endTime: new Date(),
      duration: finalSeconds,
      earnedMoney,
      kaki_earned: kakiEarned,
      username: username,
    };

    // Save to localStorage
    const updatedSessions = [session, ...sessions];
    localStorage.setItem('wc-timer-sessions', JSON.stringify(updatedSessions));
    setSessions(updatedSessions);

    // Save to Supabase if logged in
    if (user) {
      try {
        const { error } = await supabase
          .from('timer_sessions')
          .insert({
            user_id: user.id,
            start_time: session.startTime.toISOString(),
            end_time: session.endTime.toISOString(),
            duration: session.duration,
            earned_money: session.earnedMoney,
            kaki_earned: session.kakiEarned,
            username: session.username
          });

        if (error) {
          console.error('Error saving session:', error);
        } else {
          // Update kaki count
          const newKakiCount = kakiCount + kakiEarned;
          setKakiCount(newKakiCount);
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ kaki_count: newKakiCount })
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Error updating kaki count:', error);
          }
        }
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }

    // Show success message
    toast({
      title: "🏁 Timer befejezve!",
      description: `${formatTime(finalSeconds)} - ${formatMoney(earnedMoney)} Ft + ${kakiEarned} 💩 kaki!`,
    });
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
    
    // Refresh username from localStorage after auth success
    const savedUsername = localStorage.getItem('wc-timer-username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // A felhasználónév megmarad offline módban is
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
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            onOpenSettings={() => setActiveTab('profile')}
            onOpenStats={() => setActiveTab('profile')}
            onOpenAuth={() => setShowAuth(true)}
            onOpenOnlineLeaderboard={() => setActiveTab('social')}
            onLogout={handleLogout}
            onKakiUpdate={handleKakiUpdate}
            onNavigateToGames={() => setActiveTab('games')}
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
            onOpenOnlineLeaderboard={() => {}} // Handled within SocialPage
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
        onLogout={handleLogout}
        onOpenStats={() => setActiveTab('profile')}
        onOpenAuth={() => setShowAuth(true)}
        user={user}
      />

      {/* Main Content */}
      <div className="pt-14 pb-20 px-4">
        <div className="max-w-md mx-auto">
          {renderActiveTab()}
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
    </div>
  );
};

export default Index;
