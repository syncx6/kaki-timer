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
    const savedUsername = localStorage.getItem('wc-timer-username');
    
    if (savedSalary) setSalary(parseFloat(savedSalary));
    if (savedWorkHours) setWorkHours(parseFloat(savedWorkHours));
    if (savedUsername) setUsername(savedUsername);
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
          // Ne töröljük a felhasználónevet kijelentkezéskor, hogy offline módban is működjön
          // setUsername('');
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
        // Ha nincs profil, próbáljuk létrehozni
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              username: userData.user.email?.split('@')[0] || 'Felhasználó',
              kaki_count: 0
            });
          
          if (!insertError) {
            // Csak akkor állítjuk be, ha nincs localStorage-ból betöltött
            if (!localStorage.getItem('wc-timer-username')) {
              setUsername(userData.user.email?.split('@')[0] || 'Felhasználó');
            }
          }
        }
        return;
      }
      
      console.log('Profile data:', data);
      // Csak akkor állítjuk be a username-t, ha nincs már localStorage-ból betöltött
      if (!localStorage.getItem('wc-timer-username')) {
        setUsername(data?.username || 'Felhasználó');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Csak akkor állítjuk be, ha nincs localStorage-ból betöltött
      if (!localStorage.getItem('wc-timer-username')) {
        setUsername('Felhasználó');
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

  const handleAuthSuccess = () => {
    setShowAuth(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Ne töröljük a localStorage-ból a felhasználónevet, hogy offline módban is működjön
    // setUsername(''); // Ezt kommenteljük ki
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
        username={username}
        onSave={handleSaveSettings}
        onOpenAuth={() => setShowAuth(true)}
        isOnline={!!user}
        user={user}
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
