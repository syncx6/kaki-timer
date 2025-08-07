import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Clock, Target, Zap, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface PVPChallenge {
  id: string;
  challenger_id: string;
  challenger_username: string;
  target_id: string;
  target_username: string;
  challenger_score: number;
  target_score: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  created_at: string;
  completed_at?: string;
  winner_id?: string;
}

interface PVPGameProps {
  open: boolean;
  onClose: () => void;
  user: SupabaseUser | null;
  username: string;
  onKakiUpdate?: (change: number) => void; // Callback to update kaki count in parent
}

export function PVPGame({ open, onClose, user, username, onKakiUpdate }: PVPGameProps) {
  const [gameState, setGameState] = useState<'menu' | 'challenge' | 'playing' | 'result'>('menu');
  const [clickCount, setClickCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [challenges, setChallenges] = useState<PVPChallenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<PVPChallenge | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<{user_id: string, username: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gameResult, setGameResult] = useState<{
    playerScore: number;
    opponentScore: number;
    isWinner: boolean;
    reward: number;
    opponentName: string;
  } | null>(null);
  const { toast } = useToast();

  // Load challenges and available players
  useEffect(() => {
    if (open && user) {
      console.log('Loading PVP data for user:', user.id);
      loadChallenges();
      loadAvailablePlayers();
    }
  }, [open, user]);

  const loadChallenges = async () => {
    try {
      console.log('Loading challenges for user:', user?.id);
      
      const { data, error } = await supabase
        .from('pvp_challenges')
        .select('*')
        .or(`challenger_id.eq.${user?.id},target_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading challenges:', error);
        // For now, just set empty array since table doesn't exist
        setChallenges([]);
        return;
      }
      
      console.log('Challenges loaded:', data);
      setChallenges(data || []);
    } catch (error) {
      console.error('Error loading challenges:', error);
      setChallenges([]);
    }
  };

  const loadAvailablePlayers = async () => {
    try {
      console.log('Loading available players for user:', user?.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username')
        .neq('user_id', user?.id)
        .order('username');

      if (error) {
        console.error('Error loading players:', error);
        // Fallback: create demo players
        setAvailablePlayers([
          { user_id: 'demo1', username: 'KakiKiraly' },
          { user_id: 'demo2', username: 'WCMester' },
          { user_id: 'demo3', username: 'TimerPro' }
        ]);
        return;
      }
      
      console.log('Available players loaded:', data);
      
      // Filter out empty usernames and ensure we have valid data
      const validPlayers = (data || []).filter(player => 
        player.username && player.username.trim() !== '' && player.user_id
      );
      
      if (validPlayers.length === 0) {
        // If no real players, use demo players
        setAvailablePlayers([
          { user_id: 'demo1', username: 'KakiKiraly' },
          { user_id: 'demo2', username: 'WCMester' },
          { user_id: 'demo3', username: 'TimerPro' }
        ]);
      } else {
        setAvailablePlayers(validPlayers);
      }
    } catch (error) {
      console.error('Error loading players:', error);
      // Fallback: create demo players
      setAvailablePlayers([
        { user_id: 'demo1', username: 'KakiKiraly' },
        { user_id: 'demo2', username: 'WCMester' },
        { user_id: 'demo3', username: 'TimerPro' }
      ]);
    }
  };

  const startGame = () => {
    console.log('Starting game...');
    setClickCount(0);
    setTimeLeft(8);
    setIsPlaying(true);
    setGameState('playing');
    setGameResult(null); // Reset previous result
    console.log('Game started, isPlaying:', true, 'gameState: playing');
    
    // Force a re-render to ensure isPlaying is set
    setTimeout(() => {
      console.log('Game state after timeout - isPlaying:', true);
    }, 100);
  };

  const handleClick = useCallback(() => {
    console.log('Click detected! isPlaying:', isPlaying, 'timeLeft:', timeLeft);
    if (isPlaying) {
      // Start timer on first click
      if (timeLeft === 8) {
        console.log('First click - starting timer!');
        setTimeLeft(7); // Start countdown from 7
      } else if (timeLeft > 0) {
        // Continue counting clicks
        setClickCount(prev => {
          const newCount = prev + 1;
          console.log('Click! New count:', newCount);
          return newCount;
        });
      }
    }
  }, [isPlaying, timeLeft]);

  const resetGame = () => {
    setClickCount(0);
    setTimeLeft(8);
    setIsPlaying(false);
    setGameState('menu');
    setSelectedChallenge(null);
    setGameResult(null);
  };

  // Game timer
  useEffect(() => {
    console.log('Timer effect - isPlaying:', isPlaying, 'timeLeft:', timeLeft);
    
    if (isPlaying && timeLeft > 0 && timeLeft < 8) { // Only countdown when timer has started (timeLeft < 8)
      const timer = setTimeout(() => {
        console.log('Timer tick, timeLeft:', timeLeft - 1);
        setTimeLeft(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (isPlaying && timeLeft === 0) {
      console.log('Game ended, calling endGame');
      endGame();
    }
  }, [isPlaying, timeLeft]);

  // Debug effect to monitor game state
  useEffect(() => {
    console.log('Game state changed - isPlaying:', isPlaying, 'clickCount:', clickCount, 'timeLeft:', timeLeft);
  }, [isPlaying, clickCount, timeLeft]);

  const endGame = async () => {
    console.log('Ending game, final click count:', clickCount);
    setIsPlaying(false);
    
    if (!selectedChallenge) return;
    
    // Demo mode - simulate game result
    const demoOpponentScore = Math.floor(Math.random() * 50) + 20; // Random score between 20-70
    const isWinner = clickCount > demoOpponentScore;
    const opponentName = selectedChallenge.target_username || 'Ellenfél';
    
    // Calculate kaki rewards
    const kakiChange = isWinner ? 3 : -1; // Winner gets 3, loser loses 1
    
    console.log('Game result:', { clickCount, demoOpponentScore, isWinner, opponentName, kakiChange });
    
    // Update kaki count in parent component
    if (onKakiUpdate) {
      onKakiUpdate(kakiChange);
    }
    
    // Store result for display
    setGameResult({
      playerScore: clickCount,
      opponentScore: demoOpponentScore,
      isWinner,
      reward: kakiChange,
      opponentName
    });
    
    toast({
      title: isWinner ? "🏆 Győzelem!" : "💀 Veszteség!",
      description: `${isWinner ? 'Nyertél' : 'Vesztettél'} ${Math.abs(kakiChange)} kaki-t! (${clickCount} vs ${demoOpponentScore})`,
      variant: isWinner ? "default" : "destructive",
    });
    
    setGameState('result');
  };

  const challengePlayer = async (targetId: string, targetUsername: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log('Creating challenge:', { challenger_id: user.id, challenger_username: username, target_id: targetId, target_username: targetUsername });
      
      // Create a demo challenge and start the game immediately
      const demoChallenge = {
        id: Date.now().toString(),
        challenger_id: user.id,
        challenger_username: username,
        target_id: targetId,
        target_username: targetUsername,
        status: 'pending'
      };
      
      console.log('Demo challenge created for:', targetUsername);

      toast({
        title: "⚔️ Kihívás elküldve!",
        description: `${targetUsername} megkapta a kihívásod! (Demo mód)`,
      });

      // Start the game immediately
      setSelectedChallenge(demoChallenge);
      setClickCount(0);
      setTimeLeft(8);
      setIsPlaying(true);
      setGameState('playing');
      setGameResult(null); // Reset previous result
      
      // Force a re-render to ensure isPlaying is set
      setTimeout(() => {
        console.log('Challenge created - isPlaying:', true);
      }, 100);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: "❌ Hiba",
        description: "Nem sikerült elküldeni a kihívást!",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const acceptChallenge = async (challenge: PVPChallenge) => {
    try {
      console.log('Accepting challenge:', challenge);
      // Demo mode - start the game immediately
      setSelectedChallenge(challenge);
      setClickCount(0);
      setTimeLeft(8);
      setIsPlaying(true);
      setGameState('playing');
      setGameResult(null); // Reset previous result
      
      // Force a re-render to ensure isPlaying is set
      setTimeout(() => {
        console.log('Challenge accepted - isPlaying:', true);
      }, 100);
      
      toast({
        title: "⚔️ Kihívás elfogadva!",
        description: `${challenge.challenger_username} ellen játszol!`,
      });
    } catch (error) {
      console.error('Error accepting challenge:', error);
    }
  };

  const declineChallenge = async (challenge: PVPChallenge) => {
    try {
      // Demo mode - just remove from local state
      setChallenges(prev => prev.filter(c => c.id !== challenge.id));
    } catch (error) {
      console.error('Error declining challenge:', error);
    }
  };

  const challengeRandom = async () => {
    console.log('Available players:', availablePlayers);
    
    if (availablePlayers.length === 0) {
      toast({
        title: "😔 Nincs elérhető játékos",
        description: "Próbáld újra később!",
      });
      return;
    }

    const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
    console.log('Selected random player:', randomPlayer);
    
    // Start the game immediately with random player
    const demoChallenge = {
      id: Date.now().toString(),
      challenger_id: user?.id || '',
      challenger_username: username,
      target_id: randomPlayer.user_id,
      target_username: randomPlayer.username,
      status: 'pending'
    };
    
    setSelectedChallenge(demoChallenge);
    setClickCount(0);
    setTimeLeft(8);
    setIsPlaying(true);
    setGameState('playing');
    setGameResult(null); // Reset previous result
    
    // Force a re-render to ensure isPlaying is set
    setTimeout(() => {
      console.log('Random challenge - isPlaying:', true);
    }, 100);
    
    toast({
      title: "⚔️ Random kihívás!",
      description: `${randomPlayer.username} ellen játszol! (Demo mód)`,
    });
  };

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            ⚔️ PVP Kaki Harc
          </DialogTitle>
        </DialogHeader>

        {gameState === 'menu' && (
          <div className="space-y-4">
            <Card className="p-4 text-center">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-lg font-bold">Kaki Harc</div>
              <div className="text-sm text-muted-foreground">
                8 másodperc alatt minél többször kattints!
              </div>
            </Card>

            <div className="space-y-2">
              <Button
                onClick={() => setGameState('challenge')}
                className="w-full"
                size="lg"
              >
                <Users className="w-5 h-5 mr-2" />
                Játékos Kiválasztása
              </Button>

              <Button
                onClick={challengeRandom}
                variant="outline"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                <Zap className="w-5 h-5 mr-2" />
                Random Ellenfél
              </Button>
            </div>

            {challenges.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Aktív Kihívások</h3>
                {challenges.filter(c => c.status === 'pending' && c.target_id === user?.id).map(challenge => (
                  <Card key={challenge.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{challenge.challenger_username}</div>
                        <div className="text-xs text-muted-foreground">kihívott téged</div>
                      </div>
                      <div className="space-x-2">
                        <Button
                          onClick={() => acceptChallenge(challenge)}
                          size="sm"
                          variant="default"
                        >
                          Elfogad
                        </Button>
                        <Button
                          onClick={() => declineChallenge(challenge)}
                          size="sm"
                          variant="destructive"
                        >
                          Elutasít
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {gameState === 'challenge' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-center">Válassz Ellenfelet</h3>
            <div className="text-xs text-muted-foreground text-center">
              {availablePlayers.length} játékos elérhető
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availablePlayers.length === 0 ? (
                <Card className="p-4 text-center">
                  <div className="text-muted-foreground">Nincs elérhető játékos</div>
                </Card>
              ) : (
                availablePlayers.map(player => (
                  <Card key={player.user_id} className="p-3 cursor-pointer hover:bg-accent/50" onClick={() => challengePlayer(player.user_id, player.username)}>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{player.username}</div>
                      <Button size="sm" variant="outline">
                        Kihívás
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
            <Button onClick={() => setGameState('menu')} variant="outline" className="w-full">
              Vissza
            </Button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-4 text-center">
            <div className="text-4xl font-bold text-primary">
              {timeLeft === 8 ? "Kezdés..." : formatTime(timeLeft)}
            </div>
            
            <div className="relative">
              <div 
                className="w-64 h-64 bg-primary rounded-full flex items-center justify-center cursor-pointer mx-auto transition-transform hover:scale-105 active:scale-95 select-none touch-manipulation"
                onClick={handleClick}
                onTouchStart={handleClick}
                style={{ 
                  userSelect: 'none', 
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <div className="text-white text-8xl font-bold pointer-events-none">🚽</div>
              </div>
            </div>

            <div className="text-2xl font-bold">
              {clickCount} kattintás
            </div>

            <div className="text-sm text-muted-foreground">
              {timeLeft === 8 ? "Kattints az első kattintásért!" : "Kattints minél gyorsabban!"}
            </div>
            
            <div className="text-xs text-muted-foreground">
              Debug: isPlaying={isPlaying.toString()}, timeLeft={timeLeft}
            </div>
          </div>
        )}

        {gameState === 'result' && gameResult && (
          <div className="space-y-6 text-center">
            {/* Header */}
            <div className="space-y-2">
              <div className="text-6xl mb-2">
                {gameResult.isWinner ? "🏆" : "💀"}
              </div>
              
              <div className="text-3xl font-bold">
                {gameResult.isWinner ? "GYŐZELEM!" : "VESZTESÉG!"}
              </div>
            </div>

            {/* Score Panel */}
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
              <div className="space-y-4">
                <div className="text-lg font-semibold text-primary">
                  ⚔️ PVP Harc Eredmény
                </div>
                
                <div className="flex items-center justify-between text-2xl font-bold">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Te</div>
                    <div className="text-primary">{gameResult.playerScore}</div>
                  </div>
                  
                  <div className="text-4xl font-bold text-muted-foreground">VS</div>
                  
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">{gameResult.opponentName}</div>
                    <div className="text-destructive">{gameResult.opponentScore}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Reward Panel */}
            <Card className={`p-4 border-2 ${gameResult.isWinner ? 'border-success/30 bg-success/10' : 'border-destructive/30 bg-destructive/10'}`}>
              <div className="space-y-2">
                <div className="text-lg font-semibold">
                  {gameResult.isWinner ? "🎉 Nyertél!" : "😔 Vesztettél"}
                </div>
                
                <div className="text-2xl font-bold">
                  {gameResult.isWinner ? "+" : ""}{gameResult.reward} 💩 kaki
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {gameResult.isWinner 
                    ? "Nyertél 3 kaki-t a győzelemért!" 
                    : "Elvesztettél 1 kaki-t a veszteségért"
                  }
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button onClick={resetGame} className="w-full" size="lg">
                🎮 Új Harc
              </Button>
              
              <Button onClick={() => setGameState('menu')} variant="outline" className="w-full">
                🏠 Vissza a Menübe
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 