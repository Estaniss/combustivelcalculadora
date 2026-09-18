import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { lightColors, darkColors, ColorScheme } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadow } from './spacing';
import { storageService, StorageKeys } from '@services/storage/storageService';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadow: typeof shadow;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<Theme | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const systemScheme = Appearance.getColorScheme();

  useEffect(() => {
    storageService.getItem<ThemeMode>(StorageKeys.THEME_MODE).then((saved) => {
      if (saved) setModeState(saved);
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    storageService.setItem(StorageKeys.THEME_MODE, newMode);
  };

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const value = useMemo<Theme>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      typography,
      spacing,
      borderRadius,
      shadow,
      mode,
      isDark,
      setMode,
    }),
    [isDark, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  return ctx;
}
