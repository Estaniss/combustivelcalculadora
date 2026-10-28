import { contrastRatio } from '../colorUtils';
import { ColorScheme, darkColors, lightColors } from '../colors';

type Pair = [fg: keyof ColorScheme, bg: keyof ColorScheme, min: number, why: string];

/** Texto precisa de 4,5:1 (AA); texto principal pedimos 7:1; bordas de campos, 3:1 (WCAG 1.4.11). */
const PAIRS: Pair[] = [
  ['text', 'background', 7, 'texto principal na tela'],
  ['text', 'surface', 7, 'texto principal em cards'],
  ['text', 'surfaceMuted', 7, 'texto principal em áreas rebaixadas'],
  ['textSecondary', 'background', 4.5, 'texto de apoio na tela'],
  ['textSecondary', 'surface', 4.5, 'texto de apoio em cards'],
  ['textSecondary', 'surfaceMuted', 4.5, 'texto de apoio em áreas rebaixadas'],
  ['textMuted', 'background', 4.5, 'placeholder/legenda na tela'],
  ['textMuted', 'surface', 4.5, 'placeholder em inputs'],
  ['primary', 'background', 4.5, 'links e números em destaque na tela'],
  ['primary', 'surface', 4.5, 'links e números em destaque em cards'],
  ['primary', 'accentSoft', 4.5, 'texto de item selecionado'],
  ['onPrimary', 'primary', 4.5, 'texto do botão principal'],
  ['onPrimary', 'primaryPressed', 4.5, 'texto do botão principal pressionado'],
  ['success', 'background', 4.5, 'status "aberto" (texto)'],
  ['success', 'surface', 4.5, 'status "aberto" em cards'],
  ['warning', 'background', 4.5, 'aviso (texto)'],
  ['warning', 'surface', 4.5, 'aviso em cards'],
  ['error', 'background', 4.5, 'mensagem de erro'],
  ['error', 'surface', 4.5, 'mensagem de erro em cards'],
  ['inputBorder', 'surface', 3, 'borda de campo sobre card'],
  ['inputBorder', 'background', 3, 'borda de campo sobre a tela'],
];

describe.each([
  ['claro', lightColors],
  ['escuro', darkColors],
])('contraste WCAG — tema %s', (_name, colors) => {
  it.each(PAIRS)('%s sobre %s ≥ %d:1 (%s)', (fg, bg, min) => {
    expect(contrastRatio(colors[fg], colors[bg])).toBeGreaterThanOrEqual(min);
  });

  it('todas as cores sólidas são hexadecimais válidos', () => {
    for (const [key, value] of Object.entries(colors)) {
      if (key === 'overlay') continue;
      expect(value).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});

describe('identidade', () => {
  it('o acento escuro continua sendo azul (matiz ≈ 206°), não cinza', () => {
    const hex = darkColors.primary.replace('#', '');
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    expect((b as number) - (r as number)).toBeGreaterThan(60); // bem mais azul que vermelho
    expect(b as number).toBeGreaterThan(g as number);
  });
});
