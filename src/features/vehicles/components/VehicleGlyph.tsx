import React, { useMemo } from 'react';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { VehicleIcon, VEHICLE_ICON_LABELS, normalizeVehicleIcon } from '@/domain/vehicle';
import { illustrationPalette } from '@components/Illustration/palette';
import { renderGlyph } from './glyphs';

export interface VehicleGlyphProps {
  /** Aceita o novo tipo 'car' e o emoji antigo '🚗'. */
  icon?: VehicleIcon | string;
  size?: number;
  /** Sobrescreve a leitura do leitor de tela. */
  label?: string;
}

export function VehicleGlyph({ icon, size = 64, label }: VehicleGlyphProps) {
  const theme = useTheme();
  const kind = normalizeVehicleIcon(icon);
  const a11yLabel = label ?? VEHICLE_ICON_LABELS[kind];
  const xml = useMemo(
    () => renderGlyph(kind, illustrationPalette(theme.colors, theme.isDark)),
    [kind, theme.colors, theme.isDark],
  );

  return (
    <SvgXml
      xml={xml}
      width={size}
      height={Math.round(size * (64 / 96))}
      accessible
      accessibilityRole="image"
      accessibilityLabel={a11yLabel}
    />
  );
}
