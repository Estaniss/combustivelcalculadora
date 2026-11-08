import { darkColors, lightColors } from '@theme/colors';
import { contrastRatio } from '@theme/colorUtils';
import { BadgeTone, badgeColors } from '../Badge';

const TONES: BadgeTone[] = ['neutral', 'accent', 'success', 'warning', 'error'];

describe.each([
  ['claro', lightColors],
  ['escuro', darkColors],
])('contraste dos selos — tema %s', (_name, colors) => {
  it.each(TONES)('selo "%s": texto sobre o fundo do selo ≥ 4,5:1', (tone) => {
    const { bg, fg } = badgeColors(colors, tone);
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
