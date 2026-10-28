import { ColorScheme } from '@theme/colors';
import { hexToHsl, hslToHex } from '@theme/colorUtils';
import { IllustrationPalette } from './illustrations';

/**
 * Paleta das ilustrações a partir do tema. O "sky" (azul claro) mantém o matiz
 * da marca e ganha saturação — misturar com branco deixaria a cor acinzentada.
 */
export function illustrationPalette(colors: ColorScheme, isDark: boolean): IllustrationPalette {
  const [hue, saturation] = hexToHsl(colors.primary);
  return {
    primary: colors.primary,
    soft: colors.accentSoft,
    sky: hslToHex([hue, Math.min(0.85, saturation + 0.1), isDark ? 0.36 : 0.76]),
    ink: colors.text,
    surface: colors.surface,
    muted: colors.textMuted,
  };
}
