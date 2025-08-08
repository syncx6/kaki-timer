import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Play, Square, Clock, DollarSign, Trophy, TrendingUp, Sword, Target, Zap, BarChart3, Users, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { PVPPlayerSearch } from './PVPPlayerSearch';
import { PVPChallenge } from './PVPChallenge';

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

interface PVPGameData {
  id: string;
  player_id: string;
  player_username: string;
  player_clicks: number;
  opponent_id: string;
  opponent_username: string;
  opponent_clicks: number;
  winner_id: string;
  created_at: string;
}

interface PVPGameProps {
  open: boolean;
  onClose: () => void;
  user: SupabaseUser | null;
  username: string;
  onKakiUpdate?: (change: number) => void; // Callback to update kaki count in parent
}

export function PVPGame({ open, onClose, user, username, onKakiUpdate }: PVPGameProps) {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'result'>('menu');
  const [timeLeft, setTimeLeft] = useState(8);
  const [clickCount, setClickCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameResult, setGameResult] = useState<{
    playerScore: number;
    opponentScore: number;
    isWinner: boolean;
    reward: number;
    opponentName: string;
  } | null>(null);
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [currentOpponent, setCurrentOpponent] = useState<{id: string, name: string} | null>(null);
  const gameInterval = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<number>(8);
  const clickCountRef = useRef<number>(0);
  const { toast } = useToast();

  const startGame = () => {
    setGameState('playing');
    setIsPlaying(false); // Don't start playing yet, wait for first click
    setClickCount(0);
    clickCountRef.current = 0; // Initialize click count ref
    setTimeLeft(8);
    countdownRef.current = 8; // Initialize countdown ref
    
    // Enable PVP touch prevention
    if (typeof window !== 'undefined' && (window as any).setPVPPlaying) {
      (window as any).setPVPPlaying(true);
    }
    
    // Don't start countdown automatically - wait for first click
  };

  const handleClick = () => {
    // If game hasn't started yet, start it on first click
    if (!isPlaying && timeLeft === 8) {
      setIsPlaying(true);
      setTimeLeft(7);
      setClickCount(1); // Start with 1 click
      clickCountRef.current = 1; // Set click count ref
      countdownRef.current = 7; // Set countdown ref
      
      // Clear any existing interval
      if (gameInterval.current) {
        clearInterval(gameInterval.current);
        gameInterval.current = null;
      }
      
      // Start countdown after first click with ref-based approach
      gameInterval.current = setInterval(() => {
        countdownRef.current -= 1;
        
        // Update the state immediately
        setTimeLeft(countdownRef.current);
        
        if (countdownRef.current <= 0) {
          if (gameInterval.current) {
            clearInterval(gameInterval.current);
            gameInterval.current = null;
          }
          endGame();
        }
      }, 1000);
      
      return;
    }
    
    // If game is playing and time is left, count the click
    if (isPlaying && timeLeft > 0) {
      clickCountRef.current += 1; // Update ref immediately
      setClickCount(prev => prev + 1);
    }
  };

  const endGame = async () => {
    // Disable PVP touch prevention
    if (typeof window !== 'undefined' && (window as any).setPVPPlaying) {
      (window as any).setPVPPlaying(false);
    }
    
    setIsPlaying(false);
    
    // Use the ref value for reliable click count
    const finalClickCount = clickCountRef.current;
    
    // Simulate opponent (CPU or real player)
    const opponentScore = currentOpponent ? 
      Math.floor(Math.random() * 50) + 30 : // Real player simulation
      Math.floor(Math.random() * 50) + 30; // CPU opponent
    
    const isWinner = finalClickCount > opponentScore;
    const kakiChange = isWinner ? 3 : -1;
    const opponentName = currentOpponent?.name || "CPU Ellenfél";
    
    // Create game data
    const gameData = {
      id: Date.now().toString(),
      player_id: user?.id || 'anonymous',
      player_username: username,
      opponent_id: currentOpponent?.id || 'cpu_1',
      opponent_username: opponentName,
      player_clicks: finalClickCount,
      opponent_clicks: opponentScore,
      status: 'completed' as const,
      created_at: new Date().toISOString(),
      winner_id: isWinner ? user?.id || 'anonymous' : (currentOpponent?.id || 'cpu_1')
    };
    
    // Save to localStorage first
    try {
      const existingGames = JSON.parse(localStorage.getItem('wc-timer-pvp-games') || '[]');
      existingGames.push(gameData);
      localStorage.setItem('wc-timer-pvp-games', JSON.stringify(existingGames));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
    
    // Save to Supabase
    if (user) {
      try {
        const { data, error } = await supabase
          .from('timer_sessions') // Use existing table as fallback
          .insert({
            user_id: user.id,
            start_time: new Date().toISOString(),
            end_time: new Date().toISOString(),
            duration: 8,
            earned_money: 0,
            kaki_earned: kakiChange,
            salary: 0,
            work_hours: 0
          });

        if (error) {
          console.error('Error saving PVP result to Supabase:', error);
        }
        
        // Update kaki count in Supabase
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('kaki_count')
            .eq('user_id', user.id)
            .single();
          
          const currentKaki = profileData?.kaki_count || 0;
          const newKaki = currentKaki + kakiChange;
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ kaki_count: newKaki })
            .eq('user_id', user.id);
          
          if (updateError) {
            console.error('Error updating kaki count:', updateError);
          }
        } catch (error) {
          console.error('Error updating kaki count:', error);
        }
        
        // Call the kaki update callback
        if (onKakiUpdate) {
          onKakiUpdate(kakiChange);
        }
        
        // Refresh stats after save
        if (typeof window !== 'undefined' && (window as any).refreshStats) {
          setTimeout(() => {
            (window as any).refreshStats();
          }, 100);
        }
      } catch (error) {
        console.error('Error saving PVP result:', error);
      }
    }
    
    // Store result for display
    setGameResult({
      playerScore: finalClickCount,
      opponentScore: opponentScore,
      isWinner,
      reward: kakiChange,
      opponentName
    });
    
    // Show result toast
    toast({
      title: isWinner ? "🏆 Győzelem!" : "💀 Veszteség!",
      description: `${isWinner ? 'Nyertél' : 'Vesztettél'} ${Math.abs(kakiChange)} kaki-t! (${finalClickCount} vs ${opponentScore})`,
      variant: isWinner ? "default" : "destructive",
    });
    
    setGameState('result');
  };

  // Game timer - REMOVED THIS CONFLICTING useEffect
  // useEffect(() => {
  //   if (gameState === 'playing' && isPlaying && timeLeft > 0) {
  //     gameInterval.current = setInterval(() => {
  //       setTimeLeft(prev => {
  //         if (prev <= 1) {
  //           endGame();
  //           return 0;
  //         }
  //         return prev - 1;
  //       });
  //     }, 1000);
  //   }

  //   return () => {
  //     if (gameInterval.current) {
  //       clearInterval(gameInterval.current);
  //     }
  //   };
  // }, [gameState, isPlaying, timeLeft]);

  // Touch prevention for PVP game
  useEffect(() => {
    if (open && gameState === 'playing' && isPlaying) {
      // Enable touch prevention
      if (typeof window !== 'undefined' && (window as any).setPVPPlaying) {
        (window as any).setPVPPlaying(true);
      }
    } else {
      // Disable touch prevention
      if (typeof window !== 'undefined' && (window as any).setPVPPlaying) {
        (window as any).setPVPPlaying(false);
      }
    }

    return () => {
      // Always disable touch prevention when component unmounts
      if (typeof window !== 'undefined' && (window as any).setPVPPlaying) {
        (window as any).setPVPPlaying(false);
      }
      // DON'T clear interval here - this was causing the bug!
      // if (gameInterval.current) {
      //   clearInterval(gameInterval.current);
      // }
    };
  }, [open, gameState, isPlaying]);

  // Monitor timeLeft changes
  useEffect(() => {
    // If timeLeft reaches 0, end the game
    if (timeLeft <= 0 && isPlaying) {
      if (gameInterval.current) {
        clearInterval(gameInterval.current);
      }
      endGame();
    }
  }, [timeLeft, isPlaying]);

  // Cleanup interval on component unmount only
  useEffect(() => {
    return () => {
      if (gameInterval.current) {
        clearInterval(gameInterval.current);
        gameInterval.current = null;
      }
    };
  }, []); // Empty dependency array - only run on unmount

  const handleChallengePlayer = (playerId: string, playerName: string) => {
    // Check if player is online (simplified logic)
    const isOnline = Math.random() > 0.5; // Simulate online status
    
    if (isOnline) {
      // Online player - start immediate battle
      setCurrentOpponent({ id: playerId, name: playerName });
      startGame();
      
      toast({
        title: "⚔️ Online harc indítva!",
        description: `${playerName} ellen harcolsz!`,
      });
    } else {
      // Offline player - start CPU battle
      setCurrentOpponent({ id: playerId, name: `${playerName} (CPU)` });
      startGame();
      
      toast({
        title: "🤖 CPU harc indítva!",
        description: `${playerName} ellen harcolsz (CPU mód)!`,
      });
    }
  };

  const handleStartGame = (challengeId: string, opponentName: string) => {
    setCurrentOpponent({ id: challengeId, name: opponentName });
    startGame();
  };

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className={`max-w-md mx-auto p-2 sm:p-4 pt-8 pvp-game-container ${gameState === 'playing' && isPlaying ? 'pvp-game-playing' : ''}`}>
                  <DialogHeader>
          <DialogTitle className="text-center text-xl sm:text-2xl flex items-center justify-center gap-2">
            ⚔️ PVP Kaki Harc
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Versenyezz más játékosokkal kattintási sebességben!
          </DialogDescription>
        </DialogHeader>

          {gameState === 'menu' && (
            <div className="space-y-4">
              <Card className="p-4 text-center">
                <div className="text-3xl mb-2">🏆</div>
                <div className="text-lg font-bold">PVP Kaki Harc</div>
                <div className="text-sm text-muted-foreground">
                  Válassz játékosokat vagy játssz CPU ellen!
                </div>
              </Card>

              <div className="space-y-2">
                <Button
                  onClick={() => setShowPlayerSearch(true)}
                  className="w-full"
                  size="lg"
                >
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Játékos Keresés
                </Button>
                
                <Button
                  onClick={() => setShowChallenges(true)}
                  className="w-full"
                  size="lg"
                >
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Kihívások
                </Button>
                
                <Button
                  onClick={startGame}
                  className="w-full"
                  size="lg"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  CPU Ellenfél
                </Button>
                
                <Button onClick={onClose} variant="outline" size="lg" className="w-full">
                  Vissza
                </Button>
              </div>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-4 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary">
                {timeLeft === 8 ? "Kezdés..." : formatTime(timeLeft)}
              </div>
              
              <div className="relative">
                <div 
                  className="w-48 h-48 sm:w-64 sm:h-64 bg-primary rounded-full flex items-center justify-center cursor-pointer mx-auto transition-transform hover:scale-105 active:scale-95 select-none touch-manipulation"
                  onClick={handleClick}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleClick();
                  }}
                  onTouchMove={(e) => e.preventDefault()}
                  onTouchEnd={(e) => e.preventDefault()}
                  onTouchCancel={(e) => e.preventDefault()}
                  style={{
                    touchAction: 'none'
                  }}
                >
                  <div className="text-6xl sm:text-8xl">🚽</div>
                </div>
                
                <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-base sm:text-lg font-bold">
                  {clickCount}
                </div>
              </div>
              
              <div className="text-base sm:text-lg">
                Kattintások: <span className="font-bold text-primary">{clickCount}</span>
              </div>
              
              {currentOpponent && (
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Ellenfél: {currentOpponent.name}
                </div>
              )}
            </div>
          )}

          {gameState === 'result' && gameResult && (
            <div className="space-y-4 text-center">
              <div className={`text-3xl sm:text-4xl font-bold ${gameResult.isWinner ? 'text-success' : 'text-destructive'}`}>
                {gameResult.isWinner ? '🏆 Győzelem!' : '💀 Veszteség!'}
              </div>
              
              <Card className="p-4 sm:p-6">
                <div className="text-xl sm:text-2xl font-bold mb-4">
                  {gameResult.playerScore} vs {gameResult.opponentScore}
                </div>
                
                <div className="space-y-2 text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span>Te:</span>
                    <span className="font-bold">{gameResult.playerScore} kattintás</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{gameResult.opponentName}:</span>
                    <span className="font-bold">{gameResult.opponentScore} kattintás</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span>Kaki változás:</span>
                      <span className={`font-bold ${gameResult.reward > 0 ? 'text-success' : 'text-destructive'}`}>
                        {gameResult.reward > 0 ? '+' : ''}{gameResult.reward} 💩
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
              
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    setGameState('menu');
                    setGameResult(null);
                    setClickCount(0);
                    clickCountRef.current = 0; // Reset click count ref
                    setTimeLeft(8);
                    countdownRef.current = 8; // Reset countdown ref
                    setIsPlaying(false);
                    setCurrentOpponent(null);
                  }}
                  className="w-full"
                  size="lg"
                >
                  Új Harc
                </Button>
                
                <Button onClick={onClose} variant="outline" size="lg" className="w-full">
                  Vissza
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Player Search Dialog */}
      <PVPPlayerSearch
        open={showPlayerSearch}
        onClose={() => setShowPlayerSearch(false)}
        user={user}
        onChallengePlayer={handleChallengePlayer}
      />

      {/* Challenges Dialog */}
      <PVPChallenge
        open={showChallenges}
        onClose={() => setShowChallenges(false)}
        user={user}
        username={username}
        onStartGame={handleStartGame}
      />
    </>
  );
} 