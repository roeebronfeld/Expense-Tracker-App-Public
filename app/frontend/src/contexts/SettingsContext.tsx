import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch, hasAuthToken } from '@/lib/api';

// Use relative URL - same domain serves both frontend and API
const API_BASE = import.meta.env.VITE_API_URL ?? "";

interface UserSettings {
  id: string;
  fullName: string;
  email: string;
  darkMode: boolean;
  defaultCurrency: string;
  budgetAlerts: boolean;
  weeklySummary: boolean;
  monthlyIncomeCents: number;
  updatedAt: string;
}

interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
const THEME_PREFERENCE_KEY = 'theme-preference';

function applyTheme(darkMode: boolean) {
  document.documentElement.classList.toggle('dark', darkMode);
  localStorage.setItem(THEME_PREFERENCE_KEY, darkMode ? 'dark' : 'light');
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchSettings() {
    if (!hasAuthToken()) {
      setSettings(null);
      applyTheme(localStorage.getItem(THEME_PREFERENCE_KEY) !== 'light');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch('/api/settings');
      setSettings(data.settings);
      applyTheme(data.settings.darkMode);
    } catch (err) {
      setSettings(null);
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    applyTheme(localStorage.getItem(THEME_PREFERENCE_KEY) !== 'light');
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
