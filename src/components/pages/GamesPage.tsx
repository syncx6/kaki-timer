import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, Trophy, Users, Target, Zap, Crown, Sword } from 'lucide-react';
import { PVPGame } from '@/components/PVPGame';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface GamesPageProps {
  user: SupabaseUser | null;
  username: string;
  onKakiUpdate: (change: number) => void;
}

export function GamesPage({ user, username, onKakiUpdate }: GamesPageProps) {
  const [showPVPGame, setShowPVPGame] = useState(false);
  const [gameStats, setGameStats] = useState({ totalMatches: 0, winRate: 0 });

  // Load PVP stats from localStorage
  const loadGameStats = () => {
    if (user) {
      try {
        const localStorageGames = JSON.parse(localStorage.getItem('wc-timer-pvp-games') || '[]');
        const userGames = localStorageGames.filter((game: any) => 
          game.player_id === user.id || game.opponent_id === user.id
        );
        
        const totalMatches = userGames.length;
        let wins = 0;
        
        userGames.forEach((game: any) => {
          if (game.player_id === user.id) {
            if (game.player_clicks > game.opponent_clicks) wins++;
          } else {
            if (game.opponent_clicks > game.player_clicks) wins++;
          }
        });
        
        const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
        
        setGameStats({ totalMatches, winRate });
      } catch (error) {
        console.error('Error loading game stats:', error);
      }
    }
  };

  useEffect(() => {
    loadGameStats();
  }, [user]);

  // Refresh stats when PVP game closes
  const handlePVPClose = () => {
    setShowPVPGame(false);
    loadGameStats(); // Refresh stats after game
  };

  const gameModes = [
    {
      id: 'pvp',
      title: 'PVP Harc',
      description: 'Kihívd más játékosokat WC kattintás versenyre!',
      icon: Sword,
      color: 'bg-red-500',
      status: 'available',
      players: '12 online'
    },
    {
      id: 'tournament',
      title: 'Versenyek',
      description: 'Részvétel heti és havi versenyeken',
      icon: Trophy,
      color: 'bg-yellow-500',
      status: 'coming-soon',
      players: 'Hamarosan'
    },
    {
      id: 'challenges',
      title: 'Kihívások',
      description: 'Egyéni kihívások és achievementek',
      icon: Target,
      color: 'bg-blue-500',
      status: 'coming-soon',
      players: 'Hamarosan'
    },
    {
      id: 'speed',
      title: 'Gyors Játék',
      description: '3 másodperces gyors reakció teszt',
      icon: Zap,
      color: 'bg-green-500',
      status: 'coming-soon',
      players: 'Hamarosan'
    }
  ];

  const handleGameClick = (gameId: string) => {
    switch (gameId) {
      case 'pvp':
        setShowPVPGame(true);
        break;
      default:
        // Coming soon games
        break;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Gamepad2 className="w-8 h-8" />
          Játékok
        </h1>
        <p className="text-muted-foreground">
          Válassz egy játék módot és kezdj el játszani!
        </p>
      </div>

      {/* Game Modes */}
      <div className="space-y-4">
        {gameModes.map((game) => {
          const Icon = game.icon;
          const isAvailable = game.status === 'available';
          
          return (
            <Card 
              key={game.id}
              className={`p-6 border-2 cursor-pointer transition-all duration-200 ${
                isAvailable 
                  ? 'hover:shadow-lg hover:scale-[1.02] border-primary/20' 
                  : 'opacity-60 border-muted'
              }`}
              onClick={() => handleGameClick(game.id)}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full ${game.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold truncate">{game.title}</h3>
                    {game.status === 'coming-soon' && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        Hamarosan
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 truncate">
                    {game.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span className="truncate">{game.players}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      {user && (
        <Card className="p-4 border-2">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Játék Statisztikák
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{gameStats.totalMatches}</div>
              <div className="text-muted-foreground">Játszott meccs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{gameStats.winRate}%</div>
              <div className="text-muted-foreground">Győzelmi arány</div>
            </div>
          </div>
        </Card>
      )}

      {/* PVP Game Dialog */}
      <PVPGame
        open={showPVPGame}
        onClose={handlePVPClose}
        user={user}
        username={username}
        onKakiUpdate={onKakiUpdate}
      />
    </div>
  );
} 