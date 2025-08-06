import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save, X, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  salary: number;
  workHours: number;
  onSave: (salary: number, workHours: number) => void;
  onOpenAuth: () => void;
  isOnline: boolean;
}

export function Settings({ open, onClose, salary, workHours, onSave, onOpenAuth, isOnline }: SettingsProps) {
  const [newSalary, setNewSalary] = useState(salary.toString());
  const [newWorkHours, setNewWorkHours] = useState(workHours.toString());
  const { toast } = useToast();

  const handleSave = () => {
    const salaryNum = parseFloat(newSalary);
    const workHoursNum = parseFloat(newWorkHours);

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

    onSave(salaryNum, workHoursNum);
    toast({
      title: "✅ Mentve!",
      description: "Beállítások sikeresen frissítve!",
    });
    onClose();
  };

  const hourlyRate = parseFloat(newSalary) / parseFloat(newWorkHours);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-4">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            ⚙️ Beállítások
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <Card className="p-6 border-2">
            <div className="space-y-4">
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
    </Dialog>
  );
}