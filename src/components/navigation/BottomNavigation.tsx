import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Home, Gamepad2, Users, User, Trophy } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: 'home' | 'games' | 'social' | 'profile';
  onTabChange: (tab: 'home' | 'games' | 'social' | 'profile') => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    {
      id: 'home' as const,
      label: 'Főoldal',
      icon: Home,
      description: 'Timer és statisztikák'
    },
    {
      id: 'games' as const,
      label: 'Játékok',
      icon: Gamepad2,
      description: 'PVP és kihívások'
    },
    {
      id: 'social' as const,
      label: 'Közösség',
      icon: Users,
      description: 'Toplista és barátok'
    },
    {
      id: 'profile' as const,
      label: 'Profil',
      icon: User,
      description: 'Beállítások és achievementek'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center justify-center h-12 w-16 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-medium">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
} 