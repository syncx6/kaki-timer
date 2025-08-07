import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save, X, Globe, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  salary: number;
  workHours: number;
  username: string;
  onSave: (salary: number, workHours: number, username: string) => void;
  onOpenAuth: () => void;
  isOnline: boolean;
  user: SupabaseUser | null;
}

export function Settings({ open, onClose, salary, workHours, username, onSave, onOpenAuth, isOnline, user }: SettingsProps) {
  const [newSalary, setNewSalary] = useState(salary.toString());
  const [newWorkHours, setNewWorkHours] = useState(workHours.toString());
  const [newUsername, setNewUsername] = useState(username);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const salaryNum = parseFloat(newSalary);
    const workHoursNum = parseFloat(newWorkHours);

    if (!newUsername.trim()) {
      toast({
        title: "❌ Hiba",
        description: "Kérlek adj meg egy felhasználónevet!",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(salaryNum) || salaryNum <= 0) {
      toast({
        title: "❌ Hiba",
        description: "Kérlek adj meg egy érvényes fizetést!",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(workHoursNum) || workHoursNum <= 0 || workHoursNum > 744) {
      toast({
        title: "❌ Hiba", 
        description: "Kérlek adj meg érvényes munkaórákat (1-744)!",
        variant: "destructive",
      });
      return;
    }

    // Ha online módban vagyunk, frissítsük a profilt is
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ username: newUsername.trim() })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating profile:', error);
          toast({
            title: "⚠️ Figyelmeztetés",
            description: "Felhasználónév frissítése nem sikerült, de a többi beállítás mentve!",
            variant: "destructive",
          });
        } else {
          // Sikeres frissítés után mentjük localStorage-ba is
          localStorage.setItem('wc-timer-username', newUsername.trim());
        }
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    } else {
      // Offline módban csak localStorage-ba mentjük
      localStorage.setItem('wc-timer-username', newUsername.trim());
    }

    onSave(salaryNum, workHoursNum, newUsername.trim());
    toast({
      title: "✅ Mentve!",
      description: "Beállítások sikeresen frissítve!",
    });
    onClose();
  };

  const hourlyRate = parseFloat(newSalary) / parseFloat(newWorkHours);

  const clearAllData = async () => {
    localStorage.removeItem('wc-timer-sessions');
    
    // Clear online data too if user is logged in
    if (user) {
      try {
        await supabase
          .from('timer_sessions')
          .delete()
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error clearing online data:', error);
      }
    }
    
    toast({
      title: "🗑️ Adatok törölve",
      description: "Minden eddigi időmérés törölve lett!",
    });
    
    setShowDeleteConfirm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-4 flex flex-col h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            ⚙️ Beállítások
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 pt-4">
          <Card className="p-6 border-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-base font-semibold">
                  👤 Felhasználónév
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Adja meg a felhasználónevet"
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Ez a név megjelenik a statisztikákban és a jobb felső sarokban
                </p>
                {newUsername && (
                  <Button
                    onClick={() => setNewUsername('')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Felhasználónév törlése
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary" className="text-base font-semibold">
                  💰 Havi nettó fizetés (Ft)
                </Label>
                <Input
                  id="salary"
                  type="number"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  placeholder="550000"
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workHours" className="text-base font-semibold">
                  ⏰ Havi munkaórák
                </Label>
                <Input
                  id="workHours"
                  type="number"
                  value={newWorkHours}
                  onChange={(e) => setNewWorkHours(e.target.value)}
                  placeholder="180"
                  className="text-lg"
                />
              </div>

              {!isNaN(hourlyRate) && hourlyRate > 0 && (
                <div className="bg-accent/50 p-4 rounded-lg border-2 border-primary/20">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Órabéred:</div>
                    <div className="text-xl font-bold text-primary">
                      {new Intl.NumberFormat('hu-HU').format(Math.round(hourlyRate))} Ft/óra
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {!isOnline && (
            <Card className="p-4 border-2 border-primary/20">
              <Button
                onClick={onOpenAuth}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <Globe className="w-5 h-5 mr-2" />
                🌐 Online Mód
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Csatlakozz az online közösséghez!
              </p>
            </Card>
          )}

          <Card className="p-4 border-2 border-destructive/20">
            <div className="space-y-3">
              <div className="text-center">
                <h3 className="font-semibold text-destructive">⚠️ Veszélyes művelet</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Ez a művelet minden adatot töröl
                </p>
              </div>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Összes adat törlése
              </Button>
            </div>
          </Card>
        </div>

        {/* Fixed bottom buttons */}
        <div className="flex-shrink-0 pt-4 space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={onClose}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <X className="w-5 h-5 mr-2" />
              Mégse
            </Button>
            
            <Button
              onClick={handleSave}
              variant="default"
              size="lg"
              className="flex-1"
            >
              <Save className="w-5 h-5 mr-2" />
              Mentés
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>💡 Tipp: Állítsd be a pontos adatokat,</p>
            <p>hogy lásd mennyit kerestel kakálás közben! 😄</p>
          </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              Biztosan törlöd?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="text-center text-muted-foreground">
              Minden adatot törlünk!<br />
              Ez nem vonható vissza.
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Mégsem
              </Button>
              <Button
                onClick={clearAllData}
                variant="destructive"
                size="lg"
                className="w-full"
              >
                Törlés
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}