import { darkColors, lightColors } from '@theme/colors';
import { illustrationPalette } from '@components/Illustration/palette';
import { VEHICLE_ICONS } from '@/domain/vehicle';
import { GLYPHS, renderGlyph } from '../components/glyphs';

describe('desenhos de veículo', () => {
  it('há um desenho para cada tipo de veículo, e só para eles', () => {
    expect(Object.keys(GLYPHS).sort()).toEqual([...VEHICLE_ICONS].sort());
  });

  describe.each([
    ['claro', illustrationPalette(lightColors, false)],
    ['escuro', illustrationPalette(darkColors, true)],
  ])('paleta %s', (_name, palette) => {
    it.each([...VEHICLE_ICONS])('"%s" renderiza sem marcadores pendentes', (kind) => {
      const svg = renderGlyph(kind, palette);
      expect(svg).toContain('viewBox="0 0 96 64"');
      expect(svg).not.toMatch(/\{\{|\}\}/);
      for (const [, hex] of svg.matchAll(/(?:fill|stroke)="(#[^"]+)"/g)) {
        expect(hex).toMatch(/^#[0-9A-F]{6}$/i);
      }
    });
  });
});
