import { darkColors, lightColors } from '@theme/colors';
import { ILLUSTRATION_NAMES, renderIllustration, IllustrationPalette } from '../illustrations';
import { illustrationPalette } from '../palette';

const PALETTES: [string, IllustrationPalette][] = [
  ['claro', illustrationPalette(lightColors, false)],
  ['escuro', illustrationPalette(darkColors, true)],
];

describe('ilustrações', () => {
  it('há ilustrações para telas, estados vazios e erro', () => {
    expect(ILLUSTRATION_NAMES).toEqual(
      expect.arrayContaining([
        'pump',
        'drops',
        'gauge',
        'route',
        'trip',
        'station',
        'clipboard',
        'offline',
      ]),
    );
  });

  describe.each(PALETTES)('paleta %s', (_label, palette) => {
    it.each(ILLUSTRATION_NAMES)(
      '"%s" renderiza sem marcadores pendentes e com tags balanceadas',
      (name) => {
        const svg = renderIllustration(name, palette);
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg.endsWith('</svg>')).toBe(true);
        expect(svg).toContain('viewBox="0 0 120 120"');
        expect(svg).not.toMatch(/\{\{|\}\}/);
        // toda cor aplicada é um hexadecimal válido
        for (const [, hex] of svg.matchAll(/(?:fill|stroke)="(#[^"]+)"/g)) {
          expect(hex).toMatch(/^#[0-9A-F]{6}$/i);
        }
        // abre/fecha: só <svg> é container; o resto é auto-fechado ou <path/>
        expect((svg.match(/<svg/g) ?? []).length).toBe(1);
        expect((svg.match(/<\w+[^>]*[^/]>/g) ?? []).filter((t) => !t.startsWith('<svg'))).toEqual(
          [],
        );
      },
    );
  });

  it('muda de cor entre o tema claro e o escuro', () => {
    const [, light] = PALETTES[0] as [string, IllustrationPalette];
    const [, dark] = PALETTES[1] as [string, IllustrationPalette];
    expect(renderIllustration('pump', light)).not.toBe(renderIllustration('pump', dark));
  });

  it('falha alto se a paleta não tiver uma cor usada', () => {
    const incomplete = { primary: '#1A4A6F' } as unknown as IllustrationPalette;
    expect(() => renderIllustration('pump', incomplete)).toThrow(/não definida/);
  });

  it('o azul claro mantém o matiz da marca (não vira cinza)', () => {
    const [, light] = PALETTES[0] as [string, IllustrationPalette];
    const hex = light.sky.replace('#', '');
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [
      number,
      number,
      number,
    ];
    expect(b - r).toBeGreaterThan(50);
  });
});
