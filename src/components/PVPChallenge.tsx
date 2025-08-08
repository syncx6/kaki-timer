import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sword, Clock, User, Check, X } from 'lucide-react';
import { supabase, pvpChannel } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface PVPChallengeData {
  id: string;
  challenger_id: string;
  challenger_username: string;
  target_id: string;
  target_username: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  created_at: string;
  expires_at: string;
}

interface PVPChallengeProps {
  open: boolean;
  onClose: () => void;
  user: SupabaseUser | null;
  username: string;
  onStartGame: (challengeId: string, opponentName: string) => void;
}

export function PVPChallenge({ open, onClose, user, username, onStartGame }: PVPChallengeProps) {
  const [challenges, setChallenges] = useState<PVPChallengeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming', 'outgoing', 'active'

  // Fetch challenges
  const fetchChallenges = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // For now, we'll use localStorage to simulate challenges
      const storedChallenges = JSON.parse(localStorage.getItem('wc-timer-pvp-challenges') || '[]');
      const userChallenges = storedChallenges.filter((challenge: PVPChallengeData) => 
        challenge.challenger_id === user.id || challenge.target_id === user.id
      );
      setChallenges(userChallenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for real-time challenge updates
  useEffect(() => {
    if (!user) return;

    const channel = pvpChannel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pvp_challenges'
      }, (payload) => {
        console.log('PVP challenge update:', payload);
        fetchChallenges();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch challenges when component opens
  useEffect(() => {
    if (open) {
      fetchChallenges();
    }
  }, [open, user]);

  const handleAcceptChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      // Update challenge status
      const updatedChallenges = challenges.map(challenge => 
        challenge.id === challengeId 
          ? { ...challenge, status: 'accepted' as const }
          : challenge
      );
      setChallenges(updatedChallenges);

      // Save to localStorage for now
      localStorage.setItem('wc-timer-pvp-challenges', JSON.stringify(updatedChallenges));

      // Start the game
      const challenge = challenges.find(c => c.id === challengeId);
      if (challenge) {
        onStartGame(challengeId, challenge.challenger_username);
      }
    } catch (error) {
      console.error('Error accepting challenge:', error);
    }
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      // Update challenge status
      const updatedChallenges = challenges.map(challenge => 
        challenge.id === challengeId 
          ? { ...challenge, status: 'declined' as const }
          : challenge
      );
      setChallenges(updatedChallenges);

      // Save to localStorage for now
      localStorage.setItem('wc-timer-pvp-challenges', JSON.stringify(updatedChallenges));
    } catch (error) {
      console.error('Error declining challenge:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins <= 0) return 'Lejárt';
    if (diffMins < 60) return `${diffMins} perc`;
    return `${Math.floor(diffMins / 60)} óra ${diffMins % 60} perc`;
  };

  const pendingChallenges = challenges.filter(c => c.status === 'pending');
  const activeChallenges = challenges.filter(c => c.status === 'accepted');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-2 sm:p-4 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center text-xl sm:text-2xl flex items-center justify-center gap-2">
            📨 Kihívások
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          {/* Tabs */}
          <div className="flex-shrink-0 mb-4">
            <div className="flex gap-2 text-xs sm:text-sm">
              <Button
                variant={activeTab === 'incoming' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('incoming')}
                className="flex-1"
              >
                Bejövő
              </Button>
              <Button
                variant={activeTab === 'outgoing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('outgoing')}
                className="flex-1"
              >
                Kimenő
              </Button>
              <Button
                variant={activeTab === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('active')}
                className="flex-1"
              >
                Aktív
              </Button>
            </div>
          </div>

          {/* Challenges List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Betöltés...</div>
              </div>
            ) : challenges.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  {activeTab === 'incoming' ? 'Nincsenek bejövő kihívások' :
                   activeTab === 'outgoing' ? 'Nincsenek kimenő kihívások' :
                   'Nincsenek aktív játékok'}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {challenges.map((challenge) => (
                  <Card key={challenge.id} className="p-3 sm:p-4 border-2">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-primary truncate">
                              {challenge.challenger_username} vs {challenge.target_username}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground truncate">
                              {new Date(challenge.created_at).toLocaleDateString('hu-HU')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            challenge.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            challenge.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            challenge.status === 'declined' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {challenge.status === 'pending' ? 'Függő' :
                             challenge.status === 'accepted' ? 'Elfogadva' :
                             challenge.status === 'declined' ? 'Elutasítva' :
                             'Befejezve'}
                          </div>
                        </div>
                      </div>
                      
                      {challenge.status === 'pending' && activeTab === 'incoming' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAcceptChallenge(challenge.id)}
                            size="sm"
                            className="flex-1"
                          >
                            Elfogadás
                          </Button>
                          <Button
                            onClick={() => handleDeclineChallenge(challenge.id)}
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                          >
                            Elutasítás
                          </Button>
                        </div>
                      )}
                      
                      {challenge.status === 'accepted' && activeTab === 'active' && (
                        <Button
                          onClick={() => onStartGame(challenge.id, challenge.target_username)}
                          size="sm"
                          className="w-full"
                        >
                          Játék Indítása
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex-shrink-0 mt-4">
            <Button onClick={onClose} variant="outline" className="w-full">
              Vissza
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 