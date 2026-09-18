import { appConfig } from '@config/app.config';

/**
 * Paleta de cores do app. As cores "primary"/"secondary" vêm do
 * app.config.ts para que a identidade visual mude junto com a
 * configuração do aplicativo.
 */
export const lightColors = {
  primary: appConfig.primaryColor,
  secondary: appConfig.secondaryColor,
  background: '#FFFFFF',
  surface: '#F5F7FA',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#16A34A',
  error: '#DC2626',
  warning: '#D97706',
  disabled: '#D1D5DB',
  overlay: 'rgba(0,0,0,0.4)',
};

export const darkColors: typeof lightColors = {
  primary: appConfig.primaryColor,
  secondary: appConfig.secondaryColor,
  background: '#0B0F19',
  surface: '#111827',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#1F2937',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  disabled: '#374151',
  overlay: 'rgba(0,0,0,0.6)',
};

export type ColorScheme = typeof lightColors;
