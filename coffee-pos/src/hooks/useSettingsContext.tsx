import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Settings } from '../types';
import { getSettings, updateSettings } from '../services/db';

interface SettingsContextType {
  settings: Settings;
  refreshSettings: () => Promise<void>;
  saveSettings: (s: Settings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>({ shopName: 'محل القهوة', currency: 'د.ك' });

  const refreshSettings = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
  }, []);

  const saveSettings = useCallback(async (s: Settings) => {
    await updateSettings(s);
    setSettings(s);
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
