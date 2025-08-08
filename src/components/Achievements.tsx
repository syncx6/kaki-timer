import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Trophy, Lock, Unlock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'timer' | 'pvp' | 'social' | 'special';
  requirement_type: 'sessions' | 'time' | 'kaki' | 'wins' | 'clicks';
  requirement_value: number;
  reward_kaki: number;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
}

interface AchievementsProps {
  open: boolean;
  onClose: () => void;
  user: SupabaseUser | null;
}

export function Achievements({ open, onClose, user }: AchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchAchievements();
    }
  }, [open, user]);

  const fetchAchievements = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true });

      // Fetch user achievements
      const { data: userAchievementsData } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user?.id);

      setAchievements(achievementsData || []);
      setUserAchievements(userAchievementsData || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      // Fallback to demo data
      setAchievements([
        {
          id: '1',
          title: 'Első Kakilás',
          description: 'Végezz el az első időmérő munkamenetet',
          icon: '🚽',
          category: 'timer',
          requirement_type: 'sessions',
          requirement_value: 1,
          reward_kaki: 5
        },
        {
          id: '2',
          title: 'Kakilás Mester',
          description: 'Végezz el 10 időmérő munkamenetet',
          icon: '👑',
          category: 'timer',
          requirement_type: 'sessions',
          requirement_value: 10,
          reward_kaki: 20
        },
        {
          id: '3',
          title: 'PVP Újonc',
          description: 'Játsz az első PVP meccsed',
          icon: '⚔️',
          category: 'pvp',
          requirement_type: 'wins',
          requirement_value: 1,
          reward_kaki: 10
        }
      ]);
      setUserAchievements([
        {
          id: '1',
          achievement_id: '1',
          unlocked_at: new Date().toISOString(),
          progress: 1
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'timer': return 'bg-blue-500';
      case 'pvp': return 'bg-red-500';
      case 'social': return 'bg-green-500';
      case 'special': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'timer': return 'Kakilás';
      case 'pvp': return 'PVP Harc';
      case 'social': return 'Közösség';
      case 'special': return 'Különleges';
      default: return 'Egyéb';
    }
  };

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6" />
            Achievementek
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-muted-foreground">Betöltés...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${getCategoryColor(category)}`}></div>
                  {getCategoryName(category)}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryAchievements.map((achievement) => {
                    const unlocked = isUnlocked(achievement.id);
                    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
                    
                    return (
                      <Card 
                        key={achievement.id} 
                        className={`p-4 border-2 transition-all duration-200 ${
                          unlocked 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-300 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`text-3xl ${unlocked ? '' : 'grayscale opacity-50'}`}>
                            {achievement.icon}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold truncate">{achievement.title}</h4>
                              {unlocked && (
                                <Badge variant="default" className="text-xs">
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Feloldva
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {achievement.description}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                {achievement.requirement_value} {achievement.requirement_type}
                              </div>
                              
                              <div className="text-sm font-medium">
                                +{achievement.reward_kaki} 💩
                              </div>
                            </div>
                            
                            {userAchievement && (
                              <div className="mt-2">
                                <div className="text-xs text-muted-foreground mb-1">
                                  Haladás: {userAchievement.progress} / {achievement.requirement_value}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                      width: `${Math.min((userAchievement.progress / achievement.requirement_value) * 100, 100)}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 pb-1">
          <Button onClick={onClose} variant="outline" className="w-full h-12 text-base">
            <X className="w-5 h-5 mr-2" />
            Bezárás
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 