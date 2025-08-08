import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: false
  });
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  // Check if notifications are supported
  useEffect(() => {
    setIsSupported('Notification' in window);
  }, []);

  // Check current permission status
  useEffect(() => {
    if (isSupported) {
      const checkPermission = () => {
        const status = Notification.permission;
        setPermission({
          granted: status === 'granted',
          denied: status === 'denied',
          default: status === 'default'
        });
      };

      checkPermission();
      
      // Listen for permission changes
      const handlePermissionChange = () => {
        checkPermission();
      };

      // Note: This event doesn't exist in all browsers, but we can check periodically
      setInterval(checkPermission, 5000);
    }
  }, [isSupported]);

  // Request permission
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: "Értesítések nem támogatottak",
        description: "A böngésződ nem támogatja a push értesítéseket.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      const granted = result === 'granted';
      
      if (granted) {
        toast({
          title: "Értesítések engedélyezve!",
          description: "Most már értesítéseket fogsz kapni.",
        });
      } else {
        toast({
          title: "Értesítések letiltva",
          description: "Az értesítések engedélyezése nélkül nem fogsz értesítéseket kapni.",
          variant: "destructive"
        });
      }

      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Hiba történt",
        description: "Nem sikerült engedélyezni az értesítéseket.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Send notification
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported || !permission.granted) {
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'kaki-timer',
        requireInteraction: false,
        silent: false,
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  };

  // Send PVP challenge notification
  const sendPVPChallengeNotification = (challengerName: string) => {
    return sendNotification('⚔️ PVP Kihívás!', {
      body: `${challengerName} kihívott egy PVP harcra!`,
      actions: [
        {
          action: 'accept',
          title: 'Elfogadás'
        },
        {
          action: 'decline',
          title: 'Elutasítás'
        }
      ]
    });
  };

  // Send timer completion notification
  const sendTimerCompletionNotification = (duration: number, earnings: number, kaki: number) => {
    return sendNotification('🏁 Időmérés befejezve!', {
      body: `${duration} perc - ${earnings} Ft + ${kaki} kaki`,
    });
  };

  // Send achievement notification
  const sendAchievementNotification = (achievementName: string, description: string) => {
    return sendNotification('🏆 Új teljesítmény!', {
      body: `${achievementName}: ${description}`,
    });
  };

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    sendPVPChallengeNotification,
    sendTimerCompletionNotification,
    sendAchievementNotification
  };
} 