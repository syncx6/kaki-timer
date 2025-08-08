import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, User, Sword, Clock, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface PVPPlayer {
  id: string;
  username: string;
  kaki_count: number;
  total_sessions: number;
  pvp_wins: number;
  pvp_total: number;
  is_online: boolean;
  last_seen: string;
}

interface PVPPlayerSearchProps {
  open: boolean;
  onClose: () => void;
  user: SupabaseUser | null;
  onChallengePlayer: (playerId: string, playerName: string) => void;
}

export function PVPPlayerSearch({ open, onClose, user, onChallengePlayer }: PVPPlayerSearchProps) {
  const [players, setPlayers] = useState<PVPPlayer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'online' | 'friends'>('all');

  // Fetch available players
  const fetchPlayers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch profiles with basic stats
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, username, kaki_count')
        .neq('user_id', user.id)
        .ilike('username', `%${searchTerm}%`)
        .limit(20);

      if (error) {
        console.error('Error fetching players:', error);
        return;
      }

      // Transform data to include PVP stats
      const playersWithStats = profiles.map(profile => ({
        id: profile.user_id,
        username: profile.username,
        kaki_count: profile.kaki_count || 0,
        total_sessions: 0, // Will be calculated from timer_sessions
        pvp_wins: 0, // Will be calculated from pvp_challenges
        pvp_total: 0,
        is_online: Math.random() > 0.5, // Mock online status
        last_seen: new Date().toISOString()
      }));

      setPlayers(playersWithStats);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search players when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 2 || searchTerm.length === 0) {
        fetchPlayers();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, user]);

  // Filter players based on selected filter
  const filteredPlayers = players.filter(player => {
    if (filter === 'online') return player.is_online;
    if (filter === 'friends') return false; // TODO: Implement friends filter
    return true;
  });

  const handleChallengePlayer = (playerId: string, playerName: string) => {
    console.log('Challenging player:', playerId, playerName);
    
    // Close the dialog immediately
    onClose();
    
    // For offline players, start game immediately
    if (onChallengePlayer) {
      onChallengePlayer(playerId, playerName);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Most';
    if (diffMins < 60) return `${diffMins} perce`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} órával ezelőtt`;
    return `${Math.floor(diffMins / 1440)} nappal ezelőtt`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-2 sm:p-4 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center text-xl sm:text-2xl flex items-center justify-center gap-2">
            👥 Játékos Keresés
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search Input */}
          <div className="flex-shrink-0 mb-4">
            <input
              type="text"
              placeholder="Játékos neve..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border rounded-lg text-sm sm:text-base"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex-shrink-0 mb-4">
            <div className="flex gap-2 text-xs sm:text-sm">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="flex-1"
              >
                Minden
              </Button>
              <Button
                variant={filter === 'online' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('online')}
                className="flex-1"
              >
                Online
              </Button>
              <Button
                variant={filter === 'friends' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('friends')}
                className="flex-1"
              >
                Barátok
              </Button>
            </div>
          </div>

          {/* Players List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Betöltés...</div>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  {searchTerm ? 'Nincs találat' : 'Nincsenek játékosok'}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPlayers.map((player) => (
                  <Card key={player.user_id} className="p-3 sm:p-4 border-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-primary truncate">
                            {player.username}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground truncate">
                            {player.kaki_count} kaki • {player.is_online ? '🟢 Online' : '⚫ Offline'}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleChallengePlayer(player.user_id, player.username)}
                        size="sm"
                        className="flex-shrink-0"
                        variant={player.is_online ? "default" : "outline"}
                      >
                        {player.is_online ? "Kihívás" : "Játék"}
                      </Button>
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