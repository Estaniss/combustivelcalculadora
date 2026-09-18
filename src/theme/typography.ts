export const typography = {
  fontFamily: {
    regular: undefined, // usa a fonte padrão do sistema; troque por uma fonte custom se necessário
    medium: undefined,
    bold: undefined,
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 36,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  // Estilos prontos para uso direto: theme.typography.title
  title: { fontSize: 28, fontWeight: '700' as const },
  subtitle: { fontSize: 16, fontWeight: '400' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
  result: { fontSize: 40, fontWeight: '700' as const },
};
