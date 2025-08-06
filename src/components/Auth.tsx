import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, LogIn, X, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthProps {
  open: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export function Auth({ open, onClose, onAuthSuccess }: AuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async () => {
    if (!formData.username || !formData.password) {
      toast({
        title: "❌ Hiányzó adatok",
        description: "Felhasználónév és jelszó szükséges!",
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
        .single();

      if (existingProfile) {
        toast({
          title: "❌ Foglalt felhasználónév",
          description: "Ez a felhasználónév már foglalt!",
        });
        setIsLoading(false);
        return;
      }

      // Use username as email if no email provided
      const email = formData.email || `${formData.username}@wctimer.local`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
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
        // Create profile with username
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: data.user.id,
              username: formData.username,
            }
          ]);

        if (profileError) throw profileError;

        toast({
          title: "🎉 Regisztráció sikeres!",
          description: "Üdv a WC Timer online világában!",
        });
        onAuthSuccess();
      }
    } catch (error: any) {
      toast({
        title: "❌ Regisztráció sikertelen",
        description: error.message || "Valami hiba történt!",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if ((!formData.username && !formData.email) || !formData.password) {
      toast({
        title: "❌ Hiányzó adatok",
        description: "Felhasználónév/email és jelszó szükséges!",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Try to find user by username if no email provided
      let email = formData.email;
      if (!email && formData.username) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('username', formData.username)
          .single();
        
        if (profile) {
          email = `${formData.username}@wctimer.local`;
        } else {
          throw new Error('Felhasználó nem található!');
        }
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email: email || formData.email,
        password: formData.password,
      });

      if (error) throw error;

      toast({
        title: "🎉 Bejelentkezés sikeres!",
        description: "Üdv vissza a WC Timer-ben!",
      });
      onAuthSuccess();
    } catch (error: any) {
      toast({
        title: "❌ Bejelentkezés sikertelen",
        description: error.message || "Helytelen email vagy jelszó!",
      });
    } finally {
      setIsLoading(false);
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
                <Label htmlFor="signin-username">Felhasználónév</Label>
                <Input
                  id="signin-username"
                  placeholder="kakikiraly"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">Jelszó</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
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
                <Label htmlFor="signup-username">Felhasználónév</Label>
                <Input
                  id="signup-username"
                  placeholder="kakikiraly"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email cím (opcionális)</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="pelda@email.com (nem kötelező)"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Jelszó</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
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