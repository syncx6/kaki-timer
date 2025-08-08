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
    if (!formData.email || !formData.password || !formData.username) {
      toast({
        title: "❌ Hiányzó adatok",
        description: "Minden mező kitöltése kötelező!",
        className: "fixed bottom-4 right-4 z-50",
        duration: 1000,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use Supabase for registration
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: data.user.id,
              username: formData.username,
              kaki_count: 0
            }
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        toast({
          title: "🎉 Regisztráció sikeres!",
          description: "Üdv a WC Timer online világában!",
          className: "fixed bottom-4 right-4 z-50",
          duration: 2000,
        });
        
        // Update username in localStorage immediately after successful registration
        localStorage.setItem('wc-timer-username', formData.username);
        
        onAuthSuccess();
      }
    } catch (error: any) {
      console.error('Registration error:', error);
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
      // Use Supabase for authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Check if user has a profile, if not create one
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', data.user.id)
          .single();

        if (!profile) {
          // Create profile if it doesn't exist
          await supabase
            .from('profiles')
            .insert([
              {
                user_id: data.user.id,
                username: data.user.email?.split('@')[0] || 'Felhasználó'
              }
            ]);
          
          // Update localStorage with the username
          localStorage.setItem('wc-timer-username', data.user.email?.split('@')[0] || 'Felhasználó');
        } else {
          // Update localStorage with the existing username
          localStorage.setItem('wc-timer-username', profile.username);
        }
      }

      toast({
        title: "🎉 Bejelentkezés sikeres!",
        description: "Üdv vissza a WC Timer-ben!",
        className: "fixed bottom-4 right-4 z-50",
        duration: 1000,
      });
      onAuthSuccess();
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "❌ Bejelentkezés sikertelen",
        description: error.message || "Helytelen e-mail cím vagy jelszó!",
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
                <Label htmlFor="signup-username">Felhasználónév *</Label>
                <Input
                  id="signup-username"
                  placeholder="kakikiraly"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Ez a név megjelenik a statisztikákban és később módosítható a beállításokban
                </p>
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

        <div className="pt-2 pb-1">
          <Button onClick={onClose} variant="outline" className="w-full h-12 text-base">
            <X className="w-5 h-5 mr-2" />
            Mégse
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}