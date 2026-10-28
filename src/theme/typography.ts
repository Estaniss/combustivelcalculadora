import { TextStyle } from 'react-native';

/**
 * Inter, só nos pesos do DESIGN.md (400 / 500 / 600). No Android cada peso é um
 * arquivo de fonte: use `fontFamily` destes nomes — `fontWeight` NÃO funciona
 * com fonte customizada (há um teste que impede `fontWeight` solto no código).
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

type TextToken = Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'fontVariant' | 'textTransform'
>;

function token(
  size: number,
  fontFamily: string,
  lineHeightRatio: number,
  letterSpacing = 0,
): TextToken {
  return {
    fontFamily,
    fontSize: size,
    lineHeight: Math.round(size * lineHeightRatio),
    letterSpacing,
  };
}

export const typography = {
  fonts,
  /** Título de tela (heading-3). */
  title: token(28, fonts.semibold, 1.25, -0.4),
  /** Título de seção/modal (heading-4). */
  heading: token(22, fonts.semibold, 1.3, -0.2),
  /** Texto de apoio maior (subtitle); com `fonts.semibold` vira título de card (heading-5). */
  subtitle: token(18, fonts.regular, 1.5),
  body: token(16, fonts.regular, 1.5),
  bodyMedium: token(16, fonts.medium, 1.5),
  bodySmall: token(14, fonts.regular, 1.5),
  bodySmallMedium: token(14, fonts.medium, 1.5),
  caption: token(13, fonts.regular, 1.4),
  captionBold: token(13, fonts.semibold, 1.4),
  micro: token(12, fonts.medium, 1.4),
  microUppercase: {
    ...token(11, fonts.semibold, 1.4, 0.5),
    textTransform: 'uppercase',
  } as TextToken,
  button: token(14, fonts.medium, 1.3),
  /** Número em destaque (resultados). Dígitos de largura fixa para não "pular". */
  result: { ...token(36, fonts.semibold, 1.2, -0.5), fontVariant: ['tabular-nums'] } as TextToken,
};
