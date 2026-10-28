/**
 * Ícones funcionais (viewBox 24×24, só traço — herdam a cor do texto).
 * Cada ícone é uma lista de caminhos SVG e, opcionalmente, círculos [cx, cy, r].
 */
export interface IconDefinition {
  paths: string[];
  circles?: [number, number, number][];
}

export const ICONS = {
  'chevron-left': { paths: ['M15 5L8 12L15 19'] },
  'chevron-right': { paths: ['M9 5L16 12L9 19'] },
  close: { paths: ['M6 6L18 18', 'M18 6L6 18'] },
  plus: { paths: ['M12 5V19', 'M5 12H19'] },
  check: { paths: ['M5 12.5L10 17.5L19 7.5'] },
  trash: {
    paths: ['M4 7H20', 'M10 7V4.5H14V7', 'M6.5 7L7.5 19.5H16.5L17.5 7', 'M10 11V16', 'M14 11V16'],
  },
  edit: { paths: ['M4 20L4.6 15.4L16 4L20 8L8.6 19.4Z', 'M13.5 6.5L17.5 10.5'] },
  history: { paths: ['M4 12A8 8 0 1 0 6.3 6.3', 'M4 4.5V8.5H8', 'M12 8V12L15 14'] },
  sliders: {
    paths: ['M4 7H13', 'M17 7H20', 'M4 17H7', 'M11 17H20', 'M15 4.5V9.5', 'M9 14.5V19.5'],
  },
  'map-pin': {
    paths: ['M12 21C12 21 5 14.6 5 9.5A7 7 0 0 1 19 9.5C19 14.6 12 21 12 21Z'],
    circles: [[12, 9.5, 2.5]],
  },
  navigation: { paths: ['M12 3L19 20L12 16L5 20Z'] },
  refresh: { paths: ['M20 12A8 8 0 1 1 17.7 6.3', 'M20 4.5V8.5H16'] },
  info: { paths: ['M12 11V16', 'M12 8V8.01'], circles: [[12, 12, 9]] },
  chart: { paths: ['M5 20V12', 'M12 20V5', 'M19 20V9'] },
} satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];
