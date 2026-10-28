import {
  contrastRatio,
  ensureContrast,
  hexToHsl,
  hexToRgb,
  hslToHex,
  lightenToContrast,
  luminance,
  mix,
  rgbToHex,
} from '../colorUtils';

describe('colorUtils', () => {
  it('converte hex <-> rgb (inclusive forma curta)', () => {
    expect(hexToRgb('#1A4A6F')).toEqual([26, 74, 111]);
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
    expect(rgbToHex([26, 74, 111])).toBe('#1A4A6F');
    expect(rgbToHex([300, -5, 12.4])).toBe('#FF000C');
  });

  it('mix interpola entre duas cores', () => {
    expect(mix('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(mix('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });

  it('luminância e contraste batem com valores WCAG conhecidos', () => {
    expect(luminance('#FFFFFF')).toBeCloseTo(1, 6);
    expect(luminance('#000000')).toBeCloseTo(0, 6);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 4);
    expect(contrastRatio('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2); // referência clássica do AA
    expect(contrastRatio('#000000', '#000000')).toBe(1);
  });

  it('contraste é simétrico', () => {
    expect(contrastRatio('#1A4A6F', '#F8F8F3')).toBeCloseTo(
      contrastRatio('#F8F8F3', '#1A4A6F'),
      10,
    );
  });

  describe('ensureContrast', () => {
    it('não mexe na cor se já passa', () => {
      expect(ensureContrast('#FFFFFF', '#000000', 7)).toBe('#FFFFFF');
    });

    it('clareia até atingir o contraste pedido', () => {
      const result = ensureContrast('#1A4A6F', '#0A0A0A', 7);
      expect(contrastRatio(result, '#0A0A0A')).toBeGreaterThanOrEqual(7);
      expect(result).not.toBe('#1A4A6F');
    });

    it('escurece quando o alvo é preto', () => {
      const result = ensureContrast('#CCCCCC', '#FFFFFF', 4.5, '#000000');
      expect(contrastRatio(result, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    });

    it('devolve a cor extrema se for impossível', () => {
      expect(ensureContrast('#777777', '#808080', 21)).toBe('#FFFFFF');
    });
  });

  describe('HSL', () => {
    it('hex -> hsl -> hex é consistente', () => {
      for (const hex of ['#1A4A6F', '#FF0000', '#00FF00', '#0000FF', '#808080', '#F8F8F3']) {
        expect(hslToHex(hexToHsl(hex))).toBe(hex);
      }
    });

    it('lê o matiz do azul-marinho da marca', () => {
      const [h, s, l] = hexToHsl('#1A4A6F');
      expect(h).toBeCloseTo(206, 0);
      expect(s).toBeCloseTo(0.62, 1);
      expect(l).toBeCloseTo(0.27, 1);
    });
  });

  describe('lightenToContrast', () => {
    it('clareia mantendo o matiz da marca e atende o contraste em todos os fundos', () => {
      const backgrounds = ['#0A0A0A', '#151517', '#1C1C1E'];
      const result = lightenToContrast('#1A4A6F', backgrounds, 7);
      for (const bg of backgrounds) {
        expect(contrastRatio(result, bg)).toBeGreaterThanOrEqual(7);
      }
      expect(hexToHsl(result)[0]).toBeCloseTo(206, -1); // mesmo matiz (±5°)
      // não clareou além do necessário: a margem acima de 7:1 é pequena
      expect(contrastRatio(result, '#151517')).toBeLessThan(7.6);
    });

    it('não altera quando já passa', () => {
      expect(lightenToContrast('#FFFFFF', ['#000000'], 7)).toBe('#FFFFFF');
    });
  });
});
