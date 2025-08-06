import { useState, useEffect } from 'react';
import { Timer } from '@/components/Timer';
import { Settings } from '@/components/Settings';
import { Statistics } from '@/components/Statistics';
import { Auth } from '@/components/Auth';
import { OnlineLeaderboard } from '@/components/OnlineLeaderboard';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

const Index = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showOnlineLeaderboard, setShowOnlineLeaderboard] = useState(false);
  const [salary, setSalary] = useState(550000);
  const [workHours, setWorkHours] = useState(180);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState<string>('');

  // Load settings from localStorage
  useEffect(() => {
    const savedSalary = localStorage.getItem('wc-timer-salary');
    const savedWorkHours = localStorage.getItem('wc-timer-work-hours');
    
    if (savedSalary) setSalary(parseFloat(savedSalary));
    if (savedWorkHours) setWorkHours(parseFloat(savedWorkHours));
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
          setUsername('');
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
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setUsername(data?.username || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveSettings = (newSalary: number, newWorkHours: number) => {
    setSalary(newSalary);
    setWorkHours(newWorkHours);
    localStorage.setItem('wc-timer-salary', newSalary.toString());
    localStorage.setItem('wc-timer-work-hours', newWorkHours.toString());
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <Timer
        onOpenSettings={() => setShowSettings(true)}
        onOpenStats={() => setShowStats(true)}
        onOpenAuth={() => setShowAuth(true)}
        onOpenOnlineLeaderboard={() => setShowOnlineLeaderboard(true)}
        onLogout={handleLogout}
        salary={salary}
        workHours={workHours}
        user={user}
        username={username}
      />
      
      <Settings
        open={showSettings}
        onClose={() => setShowSettings(false)}
        salary={salary}
        workHours={workHours}
        onSave={handleSaveSettings}
      />
      
      <Statistics
        open={showStats}
        onClose={() => setShowStats(false)}
        user={user}
      />
      
      <Auth
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={handleAuthSuccess}
      />
      
      <OnlineLeaderboard
        open={showOnlineLeaderboard}
        onClose={() => setShowOnlineLeaderboard(false)}
      />
    </>
  );
};

export default Index;
