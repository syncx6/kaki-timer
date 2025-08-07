import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, Crown, TrendingUp, UserPlus, MessageCircle } from 'lucide-react';
import { OnlineLeaderboard } from '@/components/OnlineLeaderboard';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface SocialPageProps {
  user: SupabaseUser | null;
  onOpenOnlineLeaderboard: () => void;
}

export function SocialPage({ user, onOpenOnlineLeaderboard }: SocialPageProps) {
  const [showOnlineLeaderboard, setShowOnlineLeaderboard] = useState(false);

  const socialFeatures = [
    {
      id: 'leaderboard',
      title: 'Toplista',
      description: 'Nézd meg a legjobb játékosokat',
      icon: Trophy,
      color: 'bg-yellow-500',
      status: 'available'
    },
    {
      id: 'friends',
      title: 'Barátok',
      description: 'Add hozzá barátaidat és játsz velük',
      icon: UserPlus,
      color: 'bg-blue-500',
      status: 'coming-soon'
    },
    {
      id: 'chat',
      title: 'Chat',
      description: 'Beszélgess más játékosokkal',
      icon: MessageCircle,
      color: 'bg-green-500',
      status: 'coming-soon'
    },
    {
      id: 'guilds',
      title: 'Csapatok',
      description: 'Csatlakozz vagy hozz létre csapatot',
      icon: Users,
      color: 'bg-purple-500',
      status: 'coming-soon'
    }
  ];

  const handleFeatureClick = (featureId: string) => {
    switch (featureId) {
      case 'leaderboard':
        setShowOnlineLeaderboard(true);
        break;
      default:
        // Coming soon features
        break;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Users className="w-8 h-8" />
          Közösség
        </h1>
        <p className="text-muted-foreground">
          Kapcsolódj más játékosokkal és versenyezz!
        </p>
      </div>

      {/* Social Features */}
      <div className="space-y-4">
        {socialFeatures.map((feature) => {
          const Icon = feature.icon;
          const isAvailable = feature.status === 'available';
          
          return (
            <Card 
              key={feature.id}
              className={`p-6 border-2 cursor-pointer transition-all duration-200 ${
                isAvailable 
                  ? 'hover:shadow-lg hover:scale-[1.02] border-primary/20' 
                  : 'opacity-60 border-muted'
              }`}
              onClick={() => handleFeatureClick(feature.id)}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full ${feature.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold truncate">{feature.title}</h3>
                    {feature.status === 'coming-soon' && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        Hamarosan
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Community Stats */}
      <Card className="p-4 border-2">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Közösségi Statisztikák
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">1,234</div>
            <div className="text-muted-foreground">Aktív játékos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">5,678</div>
            <div className="text-muted-foreground">Mai játék</div>
          </div>
        </div>
      </Card>

      {/* Online Leaderboard Dialog */}
      <OnlineLeaderboard
        open={showOnlineLeaderboard}
        onClose={() => setShowOnlineLeaderboard(false)}
        user={user}
      />
    </div>
  );
} 