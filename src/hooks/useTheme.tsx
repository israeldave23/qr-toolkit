import { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { tokens, type ThemeColors } from '../theme';

type ThemeMode = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  colors: ThemeColors;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}>({
  colors: tokens.light,
  mode: 'system',
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  const colors = useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark' ? tokens.dark : tokens.light;
    }
    return mode === 'dark' ? tokens.dark : tokens.light;
  }, [mode, systemColorScheme]);

  return (
    <ThemeContext.Provider value={{ colors, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
