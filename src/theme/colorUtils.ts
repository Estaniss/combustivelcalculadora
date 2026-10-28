/** Utilitários de cor (WCAG) — genéricos do template. */

export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const value = parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function rgbToHex([r, g, b]: Rgb): string {
  const part = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

/** Mistura `color` com `target`: amount 0 = color, 1 = target. */
export function mix(color: string, target: string, amount: number): string {
  const a = hexToRgb(color);
  const b = hexToRgb(target);
  return rgbToHex([
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount,
  ]);
}

/** Luminância relativa (WCAG 2.x). */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG entre duas cores (1 a 21). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Clareia (ou escurece) `color` na direção de `toward` até atingir o contraste
 * mínimo contra `against`. Se nem a cor extrema atingir, devolve a extrema.
 */
export function ensureContrast(
  color: string,
  against: string,
  minRatio: number,
  toward: string = '#FFFFFF',
): string {
  if (contrastRatio(color, against) >= minRatio) return color;
  for (let step = 1; step <= 100; step++) {
    const candidate = mix(color, toward, step / 100);
    if (contrastRatio(candidate, against) >= minRatio) return candidate;
  }
  return toward;
}

export type Hsl = [number, number, number]; // h 0-360, s 0-1, l 0-1

export function hexToHsl(hex: string): Hsl {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as Rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

export function hslToHex([h, s, l]: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const sector = Math.floor((((h % 360) + 360) % 360) / 60);
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][sector] as Rgb;
  return rgbToHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}

/**
 * Clareia `color` mantendo o matiz e a saturação (a cor continua "da marca",
 * sem virar cinza) até atingir o contraste mínimo contra TODOS os fundos dados.
 */
export function lightenToContrast(color: string, backgrounds: string[], minRatio: number): string {
  const [h, s, l] = hexToHsl(color);
  for (let lightness = l; lightness <= 1; lightness += 0.01) {
    const candidate = hslToHex([h, s, Math.min(1, lightness)]);
    if (backgrounds.every((bg) => contrastRatio(candidate, bg) >= minRatio)) return candidate;
  }
  return '#FFFFFF';
}
