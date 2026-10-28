import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { tokens, type ThemeColors } from '../theme';
import { loadSettings } from '../services/settings';

type ThemeMode = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  colors: ThemeColors;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  ready: boolean;
}>({
  colors: tokens.light,
  mode: 'system',
  setMode: () => {},
  ready: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setMode(s.theme);
      setReady(true);
    });
  }, []);

  const colors = useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark' ? tokens.dark : tokens.light;
    }
    return mode === 'dark' ? tokens.dark : tokens.light;
  }, [mode, systemColorScheme]);

  return (
    <ThemeContext.Provider value={{ colors, mode, setMode, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
