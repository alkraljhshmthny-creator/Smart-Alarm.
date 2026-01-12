import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SettingsPage from "@/pages/Settings";
import { useEffect, useState } from "react";
import { useSettings } from "@/hooks/use-settings";
import { useAlarms } from "@/hooks/use-alarms";
import { AlarmOverlay } from "@/components/AlarmOverlay";
import { format } from "date-fns";
import { Alarm } from "@shared/schema";

// This layout wrapper handles global state like theme, RTL, and alarm checking
function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: settings } = useSettings();
  const { data: alarms } = useAlarms();
  const [triggeredAlarm, setTriggeredAlarm] = useState<Alarm | null>(null);

  // Apply Theme & Language
  useEffect(() => {
    if (settings) {
      document.body.setAttribute('data-theme', settings.theme || 'dark_space');
      document.documentElement.lang = settings.language || 'en';
      document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [settings]);

  // Alarm Check Loop
  useEffect(() => {
    if (!alarms) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = format(now, "HH:mm");
      // Optionally check seconds for precision, but HH:mm is standard for web alarms
      // We also need to prevent re-triggering the same alarm in the same minute
      // A simple way is to check if we are already triggered
      
      if (!triggeredAlarm) {
        const matchingAlarm = alarms.find(a => a.time === currentTime && a.isActive);
        if (matchingAlarm) {
          // Check if seconds are 00 to avoid multiple triggers, or just use a flag
          if (now.getSeconds() === 0) {
             setTriggeredAlarm(matchingAlarm);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [alarms, triggeredAlarm]);

  const handleDismiss = () => {
    setTriggeredAlarm(null);
  };

  const handleSnooze = () => {
    // In a real app, we'd add 5 mins to the alarm time or create a temp snooze alarm
    // Here we just dismiss the overlay for demo purposes
    setTriggeredAlarm(null);
  };

  return (
    <>
      {children}
      {triggeredAlarm && (
        <AlarmOverlay 
          alarm={triggeredAlarm} 
          settings={settings}
          onDismiss={handleDismiss} 
          onSnooze={handleSnooze}
        />
      )}
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppLayout>
          <Router />
        </AppLayout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
