import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Settings, BarChart3, Trophy, Award, Cog } from 'lucide-react';
import { Statistics } from '@/components/Statistics';
import { Settings as SettingsComponent } from '@/components/Settings';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface ProfilePageProps {
  user: SupabaseUser | null;
  username: string;
  salary: number;
  workHours: number;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSaveSettings: (salary: number, workHours: number, username: string) => void;
}

export function ProfilePage({ 
  user, 
  username, 
  salary, 
  workHours, 
  onOpenSettings, 
  onOpenStats, 
  onOpenAuth, 
  onLogout,
  onSaveSettings 
}: ProfilePageProps) {
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const profileFeatures = [
    {
      id: 'stats',
      title: 'Statisztikák',
      description: 'Nézd meg a részletes statisztikáidat',
      icon: BarChart3,
      color: 'bg-blue-500',
      status: 'available',
      action: 'Megtekintés'
    },
    {
      id: 'achievements',
      title: 'Achievementek',
      description: 'Nézd meg az elért eredményeidet',
      icon: Trophy,
      color: 'bg-yellow-500',
      status: 'coming-soon',
      action: 'Hamarosan'
    },
    {
      id: 'rewards',
      title: 'Jutalmak',
      description: 'Különleges jutalmak és bónuszok',
      icon: Award,
      color: 'bg-purple-500',
      status: 'coming-soon',
      action: 'Hamarosan'
    }
  ];

  const handleFeatureClick = (featureId: string) => {
    switch (featureId) {
      case 'stats':
        setShowStats(true);
        break;
      default:
        // Coming soon features
        break;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Profile Header */}
      <Card className="p-6 border-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{username || 'Felhasználó'}</h2>
              <p className="text-muted-foreground">
                {user ? 'Online felhasználó' : 'Offline mód'}
              </p>
              {user && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    Regisztrált
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Aktív
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          {user && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Szerkesztés
            </Button>
          )}
        </div>
      </Card>

      {/* Profile Features */}
      <div className="space-y-4">
        {profileFeatures.map((feature) => {
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full ${feature.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{feature.title}</h3>
                      {feature.status === 'coming-soon' && (
                        <Badge variant="secondary" className="text-xs">
                          Hamarosan
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
                
                <Button size="sm" variant="outline">
                  {feature.action}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <Card className="p-4 border-2">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Gyors Statisztikák
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {salary.toLocaleString()} Ft
            </div>
            <div className="text-muted-foreground">Órabér</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {workHours} óra
            </div>
            <div className="text-muted-foreground">Heti munkaidő</div>
          </div>
        </div>
      </Card>

      {/* Auth Section */}
      {!user && (
        <Card className="p-4 border-2 border-dashed">
          <div className="text-center space-y-3">
            <h3 className="font-semibold">Jelentkezz be a teljes funkciókhoz!</h3>
            <p className="text-sm text-muted-foreground">
              Regisztrálj és férj hozzá a statisztikákhoz, online funkciókhoz és többhez!
            </p>
            <Button onClick={onOpenAuth} className="w-full">
              Bejelentkezés / Regisztráció
            </Button>
          </div>
        </Card>
      )}

      {/* Dialogs */}
      <Statistics
        open={showStats}
        onClose={() => setShowStats(false)}
        user={user}
      />
      
      <SettingsComponent
        open={showSettings}
        onClose={() => setShowSettings(false)}
        salary={salary}
        workHours={workHours}
        username={username}
        onSave={onSaveSettings}
        onOpenAuth={onOpenAuth}
        isOnline={!!user}
        user={user}
      />
    </div>
  );
} 