import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { LogOut, BarChart3, LogIn } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserStatusDropdownProps {
  username: string;
  kakiCount: number;
  onLogout: () => void;
  onOpenStats: () => void;
  onOpenAuth: () => void;
  user: SupabaseUser | null;
}

export function UserStatusDropdown({ username, kakiCount, onLogout, onOpenStats, onOpenAuth, user }: UserStatusDropdownProps) {
  return (
    <div className="fixed top-2 right-2 z-50">
      {user ? (
        // Logged in user
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 text-success font-medium text-sm px-3 py-2 rounded-lg bg-success/10 border backdrop-blur-sm hover:bg-success/20 transition-colors">
              <span className="font-semibold">{username}</span>
              <span className="text-base font-bold">💩{kakiCount}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onOpenStats} className="cursor-pointer">
              <BarChart3 className="w-4 h-4 mr-2" />
              Statisztikák
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Kilépés
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        // Not logged in - show login button
        <button 
          onClick={onOpenAuth}
          className="flex items-center gap-2 text-primary font-medium text-sm px-3 py-2 rounded-lg bg-primary/10 border backdrop-blur-sm hover:bg-primary/20 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          <span className="font-semibold">Bejelentkezés</span>
        </button>
      )}
    </div>
  );
}