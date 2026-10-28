import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { IconDefinition, ICONS, IconName } from './icons';

export interface IconProps {
  name: IconName;
  size?: number;
  /** Padrão: cor do texto do tema. */
  color?: string;
  strokeWidth?: number;
  /** Se informado, o ícone é lido pelo leitor de tela; senão é decorativo. */
  label?: string;
}

export function Icon({ name, size = 24, color, strokeWidth = 2, label }: IconProps) {
  const theme = useTheme();
  const stroke = color ?? theme.colors.text;
  const definition: IconDefinition = ICONS[name];

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessible={Boolean(label)}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    >
      {definition.paths.map((d) => (
        <Path
          key={d}
          d={d}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {definition.circles?.map(([cx, cy, r]) => (
        <Circle
          key={`${cx}-${cy}-${r}`}
          cx={cx}
          cy={cy}
          r={r}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ))}
    </Svg>
  );
}
