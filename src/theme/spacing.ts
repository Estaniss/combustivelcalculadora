/** Escala de espaçamento do DESIGN.md (px). */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  section: 48,
};

/** Escala de raio do DESIGN.md. Botões são sempre `full` (pílula). */
export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

/**
 * Elevação: o DESIGN.md prefere superfícies planas com borda fina (nível 0).
 * sm = nível 1 (linha de brilho), md = nível 2 (destaque/modal).
 */
export const shadow = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};

/** Durações de animação (ms): transições de estado 150–200, entradas 260. */
export const motion = {
  fast: 150,
  base: 200,
  slow: 260,
} as const;
