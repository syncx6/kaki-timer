import { useState, useEffect } from 'react';
import { Timer } from '@/components/Timer';
import { Settings } from '@/components/Settings';
import { Statistics } from '@/components/Statistics';

const Index = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [salary, setSalary] = useState(550000);
  const [workHours, setWorkHours] = useState(180);

  // Load settings from localStorage
  useEffect(() => {
    const savedSalary = localStorage.getItem('wc-timer-salary');
    const savedWorkHours = localStorage.getItem('wc-timer-work-hours');
    
    if (savedSalary) setSalary(parseFloat(savedSalary));
    if (savedWorkHours) setWorkHours(parseFloat(savedWorkHours));
  }, []);

  const handleSaveSettings = (newSalary: number, newWorkHours: number) => {
    setSalary(newSalary);
    setWorkHours(newWorkHours);
    localStorage.setItem('wc-timer-salary', newSalary.toString());
    localStorage.setItem('wc-timer-work-hours', newWorkHours.toString());
  };

  return (
    <>
      <Timer
        onOpenSettings={() => setShowSettings(true)}
        onOpenStats={() => setShowStats(true)}
        salary={salary}
        workHours={workHours}
      />
      
      <Settings
        open={showSettings}
        onClose={() => setShowSettings(false)}
        salary={salary}
        workHours={workHours}
        onSave={handleSaveSettings}
      />
      
      <Statistics
        open={showStats}
        onClose={() => setShowStats(false)}
      />
    </>
  );
};

export default Index;
