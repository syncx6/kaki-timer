import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Sword, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface PVPChallenge {
  id: string;
  challenger_id: string;
  challenger_username: string;
  challenged_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
}

interface PVPChallengeNotificationProps {
  user: SupabaseUser | null;
  onChallengeAccepted: (challengeId: string, challengerName: string) => void;
}

export function PVPChallengeNotification({ user, onChallengeAccepted }: PVPChallengeNotificationProps) {
  const [activeChallenge, setActiveChallenge] = useState<PVPChallenge | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isListening, setIsListening] = useState(false);

  // Listen for incoming challenges
  useEffect(() => {
    if (!user || isListening) return;

    const setupRealtimeSubscription = () => {
      console.log('Setting up PVP challenge subscription for user:', user.id);
      
      const channel = supabase
        .channel('pvp-challenges')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'pvp_challenges',
            filter: `challenged_id=eq.${user.id}`
          },
          async (payload) => {
            console.log('New PVP challenge received:', payload);
            
            const challenge = payload.new as any;
            
            // Fetch challenger username
            const { data: challengerProfile } = await supabase
              .from('profiles')
              .select('username')
              .eq('user_id', challenge.challenger_id)
              .single();

            const challengeData: PVPChallenge = {
              id: challenge.id,
              challenger_id: challenge.challenger_id,
              challenger_username: challengerProfile?.username || 'Ismeretlen',
              challenged_id: challenge.challenged_id,
              status: challenge.status,
              created_at: challenge.created_at
            };

            setActiveChallenge(challengeData);
            setTimeLeft(10);
          }
        )
        .subscribe();

      setIsListening(true);

      return () => {
        channel.unsubscribe();
        setIsListening(false);
      };
    };

    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [user, isListening]);

  // Countdown timer
  useEffect(() => {
    if (!activeChallenge || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleDecline(); // Auto-decline when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeChallenge, timeLeft]);

  const handleAccept = async () => {
    if (!activeChallenge) return;

    try {
      // Update challenge status to accepted
      await supabase
        .from('pvp_challenges')
        .update({ status: 'accepted' })
        .eq('id', activeChallenge.id);

      // Start the PVP game
      onChallengeAccepted(activeChallenge.id, activeChallenge.challenger_username);
      
      setActiveChallenge(null);
    } catch (error) {
      console.error('Error accepting challenge:', error);
    }
  };

  const handleDecline = async () => {
    if (!activeChallenge) return;

    try {
      // Update challenge status to declined
      await supabase
        .from('pvp_challenges')
        .update({ status: timeLeft <= 0 ? 'expired' : 'declined' })
        .eq('id', activeChallenge.id);

      setActiveChallenge(null);
    } catch (error) {
      console.error('Error declining challenge:', error);
    }
  };

  if (!activeChallenge) return null;

  const progressValue = (timeLeft / 10) * 100;

  return (
    <Dialog open={!!activeChallenge} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-auto p-6 pt-8">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Sword className="w-6 h-6 text-red-500" />
            PVP Kihívás!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenger info */}
          <Card className="p-4 text-center bg-red-500/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <User className="w-5 h-5" />
              <span className="font-semibold text-lg">{activeChallenge.challenger_username}</span>
            </div>
            <p className="text-muted-foreground">kihívott PVP harcra!</p>
          </Card>

          {/* Timer */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{timeLeft} másodperc van hátra</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleDecline}
              variant="outline"
              className="flex-1 h-12"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Elutasítás
            </Button>
            
            <Button
              onClick={handleAccept}
              variant="default"
              className="flex-1 h-12 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Elfogadás
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Ha nem válaszol {timeLeft} másodpercen belül, a kihívás automatikusan elutasításra kerül.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}