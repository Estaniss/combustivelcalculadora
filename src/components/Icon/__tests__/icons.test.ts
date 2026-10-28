import { ICON_NAMES, ICONS } from '../icons';

describe('ícones', () => {
  it('têm os ícones que as telas usam', () => {
    expect(ICON_NAMES).toEqual(
      expect.arrayContaining([
        'chevron-left',
        'sliders',
        'history',
        'map-pin',
        'navigation',
        'trash',
        'edit',
        'plus',
      ]),
    );
  });

  it.each(ICON_NAMES)('"%s" tem caminhos SVG válidos', (name) => {
    const icon = ICONS[name] as { paths: string[]; circles?: number[][] };
    expect(icon.paths.length).toBeGreaterThan(0);
    for (const d of icon.paths) {
      expect(d).toMatch(/^M[\d\s.,MLHVACZ-]+$/i); // só comandos e números de caminho
      expect(d).not.toMatch(/NaN|undefined/);
    }
    for (const [cx, cy, r] of icon.circles ?? []) {
      expect(cx).toBeGreaterThanOrEqual(0);
      expect(cy).toBeLessThanOrEqual(24);
      expect(r).toBeGreaterThan(0);
    }
  });

  it('não há caminhos repetidos dentro do mesmo ícone (chave do React)', () => {
    for (const name of ICON_NAMES) {
      const icon = ICONS[name] as { paths: string[] };
      expect(new Set(icon.paths).size).toBe(icon.paths.length);
    }
  });
});
