import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ColorScheme } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadow, motion } from './spacing';
import { storageService, StorageKeys } from '@services/storage/storageService';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadow: typeof shadow;
  motion: typeof motion;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<Theme | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  // useColorScheme assina as mudanças: o modo "Sistema" acompanha o Android ao vivo.
  const systemScheme = useColorScheme();

  useEffect(() => {
    storageService.getItem<ThemeMode>(StorageKeys.THEME_MODE).then((saved) => {
      if (saved) setModeState(saved);
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    storageService.setItem(StorageKeys.THEME_MODE, newMode);
  }, []);

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const value = useMemo<Theme>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      typography,
      spacing,
      borderRadius,
      shadow,
      motion,
      mode,
      isDark,
      setMode,
    }),
    [isDark, mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  return ctx;
}
