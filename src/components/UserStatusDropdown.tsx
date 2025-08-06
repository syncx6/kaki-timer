import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { LogOut, BarChart3 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserStatusDropdownProps {
  username: string;
  kakiCount: number;
  onLogout: () => void;
  onOpenStats: () => void;
  user: SupabaseUser | null;
}

export function UserStatusDropdown({ username, kakiCount, onLogout, onOpenStats, user }: UserStatusDropdownProps) {
  if (!user) return null;

  return (
    <div className="fixed top-2 right-2 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 text-success font-medium text-sm px-2 py-1 rounded-lg bg-success/10 border backdrop-blur-sm hover:bg-success/20 transition-colors">
            <span>{username}</span>
            <span className="text-base">💩{kakiCount}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
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
    </div>
  );
}