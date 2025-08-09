import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UseUserPresenceProps {
  user: User | null;
}

export function useUserPresence({ user }: UseUserPresenceProps) {
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  // Update user's last_seen timestamp
  const updatePresence = async () => {
    if (!user) return;

    console.log('Updating presence for user:', user.id);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          last_seen: new Date().toISOString(),
          is_online: true 
        })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error updating user presence:', error);
      } else {
        console.log('Presence updated successfully:', data);
      }
    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  };

  // Set user offline when leaving
  const setOffline = async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ 
          is_online: false,
          last_seen: new Date().toISOString()
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  };

  // Start presence system
  useEffect(() => {
    if (!user) {
      // Clear interval if user logs out
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
      return;
    }

    // Initial presence update
    updatePresence();

    // Set up heartbeat (every 30 seconds)
    heartbeatInterval.current = setInterval(updatePresence, 30000);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, but keep online for a bit
        return;
      } else {
        // Page is visible, update presence immediately
        updatePresence();
      }
    };

    // Handle page unload
    const handleBeforeUnload = () => {
      // Set offline when page is closing
      setOffline();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Cleanup
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Set offline when component unmounts
      setOffline();
    };
  }, [user]);

  return {
    updatePresence,
    setOffline
  };
}