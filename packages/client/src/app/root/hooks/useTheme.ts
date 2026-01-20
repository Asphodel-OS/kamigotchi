import { useCallback, useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';

export type ThemeMode = 'light' | 'dark';

interface ThemeSettings {
  mode: ThemeMode;
}

const DEFAULT_THEME: ThemeSettings = { mode: 'light' };

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<ThemeSettings>('theme', DEFAULT_THEME);

  // Apply theme to DOM on mount and changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.mode);
  }, [theme.mode]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light',
    }));
  }, [setTheme]);

  const setMode = useCallback(
    (mode: ThemeMode) => {
      setTheme((prev) => ({ ...prev, mode }));
    },
    [setTheme]
  );

  return {
    mode: theme.mode,
    isDark: theme.mode === 'dark',
    toggleTheme,
    setMode,
  };
}
