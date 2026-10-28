import { useEffect, useState } from 'react';
import { loadSettings, persistSettings, type AppSettings } from '../services/settings';
import { setHapticsEnabled, setSoundEnabled } from '../services/feedback';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setHapticsEnabled(s.scanner.hapticsEnabled);
      setSoundEnabled(s.scanner.soundEnabled);
      setLoading(false);
    });
  }, []);

  const update = (partial: Partial<AppSettings>) => {
    const next = settings ? { ...settings, ...partial } : partial as AppSettings;
    setSettings(next);
    setHapticsEnabled(next.scanner.hapticsEnabled);
    setSoundEnabled(next.scanner.soundEnabled);
    persistSettings(next);
  };

  const setTheme = (theme: AppSettings['theme']) => update({ theme });

  const setScanner = (scanner: AppSettings['scanner']) => update({ scanner });

  return { settings, loading, update, setTheme, setScanner };
}
