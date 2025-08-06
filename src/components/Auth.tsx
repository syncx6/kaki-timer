import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, LogIn, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthProps {
  open: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export function Auth({ open, onClose, onAuthSuccess }: AuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async () => {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.email || !emailRegex.test(formData.email)) {
      toast({
        title: "❌ Helytelen e-mail formátum",
        description: "Kérlek adj meg egy érvényes e-mail címet!",
        className: "fixed bottom-4 right-4 z-50",
        duration: 1000,
      });
      return;
    }

    if (!formData.username || !formData.password) {
      toast({
        title: "❌ Hiányzó adatok",
        description: "Felhasználónév és jelszó szükséges!",
        className: "fixed bottom-4 right-4 z-50",
        duration: 1000,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Check if username already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', formData.username)
        .maybeSingle();

      if (existingProfile) {
        toast({
          title: "❌ Foglalt felhasználónév",
          description: "Ez a felhasználónév már foglalt!",
          className: "fixed bottom-4 right-4 z-50",
          duration: 1000,
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: formData.username,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile with username - wrapped in try-catch to handle RLS issues
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                user_id: data.user.id,
                username: formData.username,
              }
            ]);

          if (profileError) {
            console.warn('Profile creation warning:', profileError);
            // Continue anyway as the user account was created successfully
          }
        } catch (profileError) {
          console.warn('Profile creation warning:', profileError);
          // Continue anyway as the user account was created successfully
        }

        toast({
          title: "🎉 Regisztráció sikeres!",
          description: "Üdv a WC Timer online világában!",
          className: "fixed bottom-4 right-4 z-50",
          duration: 1000,
        });
        onAuthSuccess();
      }
    } catch (error: any) {
      toast({
        title: "❌ Regisztráció sikertelen",
        description: error.message || "Valami hiba történt!",
        className: "fixed bottom-4 right-4 z-50",
        duration: 1000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!formData.email || !formData.password) {
      toast({
        title: "❌ Hiányzó adatok",
        description: "E-mail cím és jelszó szükséges!",
        className: "fixed bottom-4 right-4 z-50",
        duration: 1000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      toast({
        title: "🎉 Bejelentkezés sikeres!",
        description: "Üdv vissza a WC Timer-ben!",
        className: "fixed bottom-4 right-4 z-50",
        duration: 1000,
      });
      onAuthSuccess();
    } catch (error: any) {
      toast({
        title: "❌ Bejelentkezés sikertelen",
        description: "Helytelen e-mail cím vagy jelszó!",
        className: "fixed bottom-4 right-4 z-50",
        duration: 1000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const activeTab = document.querySelector('[data-state="active"]')?.getAttribute('value');
      if (activeTab === 'signin') {
        handleSignIn();
      } else {
        handleSignUp();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            🌐 Online Mód
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Bejelentkezés</TabsTrigger>
            <TabsTrigger value="signup">Regisztráció</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4">
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">E-mail cím</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="kaki@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">Jelszó</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
              </div>

              <Button
                onClick={handleSignIn}
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                <LogIn className="w-5 h-5 mr-2" />
                {isLoading ? 'Bejelentkezés...' : 'Bejelentkezés'}
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <Card className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">E-mail cím</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="kaki@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-username">Felhasználónév</Label>
                <Input
                  id="signup-username"
                  placeholder="kakikiraly"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Jelszó</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
              </div>

              <Button
                onClick={handleSignUp}
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                {isLoading ? 'Regisztráció...' : 'Regisztráció'}
              </Button>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="pt-4">
          <Button onClick={onClose} variant="outline" size="lg" className="w-full">
            <X className="w-5 h-5 mr-2" />
            Mégse
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}