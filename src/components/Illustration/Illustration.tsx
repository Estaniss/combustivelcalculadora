import React, { useMemo } from 'react';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { IllustrationName, renderIllustration } from './illustrations';
import { illustrationPalette } from './palette';

export interface IllustrationProps {
  name: IllustrationName;
  size?: number;
  /** Se informado, a ilustração é lida pelo leitor de tela; senão é decorativa. */
  label?: string;
}

export function Illustration({ name, size = 96, label }: IllustrationProps) {
  const theme = useTheme();
  const xml = useMemo(
    () => renderIllustration(name, illustrationPalette(theme.colors, theme.isDark)),
    [name, theme.colors, theme.isDark],
  );

  return (
    <SvgXml
      xml={xml}
      width={size}
      height={size}
      accessible={Boolean(label)}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    />
  );
}
