import { appConfig } from '@config/app.config';
import { lightenToContrast, mix } from './colorUtils';

/**
 * Paleta derivada da cor da marca (appConfig.primaryColor = azul-marinho do
 * logo) sobre os neutros do DESIGN.md. Trocar a cor da marca em app.config.ts
 * recalcula tudo, inclusive a versão escura (clareada mantendo o matiz até
 * atingir 7:1 de contraste — ver theme/__tests__/contrast.test.ts).
 *
 * Papéis:
 *  - background  = tela;  surface = cards/inputs;  surfaceMuted = áreas rebaixadas
 *  - primary     = ação principal e destaque (único acento, como no DESIGN.md)
 *  - success/warning/error = só semântica (aberto, atenção, erro)
 */
const brand = appConfig.primaryColor;
const brandSecondary = appConfig.secondaryColor;

export const lightColors = {
  primary: brand,
  onPrimary: '#FFFFFF',
  primaryPressed: mix(brand, '#000000', 0.22),
  /** Fundo suave para estados selecionados. */
  accentSoft: mix(brand, '#FFFFFF', 0.9),
  secondary: brandSecondary,

  background: '#F8F8F3',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F0EA',
  /** Divisória/borda decorativa (hairline). */
  border: '#E4E4DD',
  /** Borda de campos de formulário (≥ 3:1 contra o fundo — WCAG 1.4.11). */
  inputBorder: '#8B8B90',

  text: '#0A0A0A',
  textSecondary: '#55555A',
  textMuted: '#6B6B70',

  success: '#0F7A52',
  warning: '#8A5A00',
  error: '#B3261E',

  disabled: '#E4E4DD',
  disabledText: '#8B8B90',
  overlay: 'rgba(10,10,10,0.5)',
};

export type ColorScheme = typeof lightColors;

export const DARK_SURFACES = ['#0A0A0A', '#151517', '#1C1C1E'] as const;
const darkPrimary = lightenToContrast(brand, [...DARK_SURFACES], 7);

export const darkColors: ColorScheme = {
  primary: darkPrimary,
  onPrimary: '#0A0A0A',
  primaryPressed: mix(darkPrimary, '#000000', 0.2),
  accentSoft: mix(darkPrimary, '#0A0A0A', 0.82),
  secondary: lightenToContrast(brandSecondary, [...DARK_SURFACES], 4.5),

  background: DARK_SURFACES[0],
  surface: DARK_SURFACES[1],
  surfaceMuted: DARK_SURFACES[2],
  border: '#2C2C30',
  inputBorder: '#76767C',

  text: '#FFFFFF',
  textSecondary: '#B4B4B9',
  textMuted: '#8E8E94',

  success: '#4CD6A0',
  warning: '#E8B04A',
  error: '#FF8F85',

  disabled: '#2C2C30',
  disabledText: '#6E6E73',
  overlay: 'rgba(0,0,0,0.65)',
};
