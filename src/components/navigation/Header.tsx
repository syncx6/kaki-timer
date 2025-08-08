import { UserStatusDropdown } from '@/components/UserStatusDropdown';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface HeaderProps {
  username: string;
  kakiCount: number;
  isRunning: boolean;
  seconds: number;
  activeTab: string;
  onLogout: () => void;
  onOpenStats: () => void;
  onOpenAuth: () => void;
  user: SupabaseUser | null;
}

export function Header({ username, kakiCount, isRunning, seconds, activeTab, onLogout, onOpenStats, onOpenAuth, user }: HeaderProps) {
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-b border-border z-40">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="text-2xl">🚽</div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-primary">WC Timer</h1>
          </div>
          {isRunning && (
            <div className="flex items-center gap-1 text-success text-sm font-medium">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              {activeTab === 'home' ? 'Fut' : formatTime(seconds)}
            </div>
          )}
        </div>

        {/* User Status */}
        <UserStatusDropdown
          username={username}
          kakiCount={kakiCount}
          onLogout={onLogout}
          onOpenStats={onOpenStats}
          onOpenAuth={onOpenAuth}
          user={user}
        />
      </div>
    </header>
  );
} 