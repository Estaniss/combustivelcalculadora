import { VehicleIcon } from '@/domain/vehicle';
import {
  IllustrationPalette,
  renderIllustrationMarkup,
} from '@components/Illustration/illustrations';

/**
 * Desenhos dos veículos (viewBox 96×64, vista lateral, estilo plano). Usam os
 * mesmos marcadores de cor das ilustrações ({{primary}}, {{surface}}, {{ink}}, {{sky}}).
 */
const open = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 64">';
const wheel = (cx: number, cy: number, r: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="{{ink}}"/><circle cx="${cx}" cy="${cy}" r="${(r * 0.4).toFixed(1)}" fill="{{surface}}"/>`;

const CAR_BODY =
  '<path d="M8 44C8 38 12 35 18 34L28 20C30 17 33 16 36 16H58C62 16 65 18 67 21L76 34C84 35 88 38 88 44V48C88 51 86 53 83 53H13C10 53 8 51 8 48Z" fill="{{primary}}"/>' +
  '<path d="M31 23L24 34H44V23Z" fill="{{surface}}"/>' +
  '<path d="M49 23H58C60 23 61 24 62 25.5L68 34H49Z" fill="{{surface}}"/>' +
  '<circle cx="84" cy="43" r="2.6" fill="{{sky}}"/><circle cx="12" cy="43" r="2.2" fill="{{sky}}"/>';

// faixa quadriculada do táxi
const checker = Array.from({ length: 17 }, (_, i) => {
  const fill = i % 2 === 0 ? '{{ink}}' : '{{surface}}';
  return `<rect x="${14 + i * 4}" y="40" width="4" height="4" fill="${fill}"/>`;
}).join('');

const stroke = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';

export const GLYPHS: Record<VehicleIcon, string> = {
  car: open + CAR_BODY + wheel(28, 53, 8) + wheel(68, 53, 8) + '</svg>',

  suv:
    open +
    '<path d="M8 46V33C8 29 11 27 15 26L23 14C25 12 28 11 31 11H70C74 11 76 13 78 16L86 29C90 30 92 33 92 37V46C92 50 90 52 87 52H13C10 52 8 50 8 46Z" fill="{{primary}}"/>' +
    '<path d="M30 17L24 27H42V17Z" fill="{{surface}}"/><path d="M47 17H57V27H47Z" fill="{{surface}}"/>' +
    '<path d="M62 17H70C71.5 17 72.5 17.8 73.5 19L79 27H62Z" fill="{{surface}}"/>' +
    `<path d="M32 7H68" ${stroke} stroke="{{ink}}" stroke-width="3"/>` +
    '<circle cx="88" cy="38" r="2.6" fill="{{sky}}"/>' +
    wheel(28, 52, 9) +
    wheel(72, 52, 9) +
    '</svg>',

  van:
    open +
    '<path d="M6 50V20C6 15 9 12 14 12H62C66 12 68 13 70 16L82 32C88 33 90 36 90 40V50C90 53 88 55 85 55H11C8 55 6 53 6 50Z" fill="{{primary}}"/>' +
    '<rect x="14" y="20" width="14" height="12" rx="2.5" fill="{{surface}}"/><rect x="32" y="20" width="14" height="12" rx="2.5" fill="{{surface}}"/>' +
    '<path d="M52 20H62L72 32H52Z" fill="{{surface}}"/>' +
    `<path d="M50 37V51" ${stroke} stroke="{{ink}}" stroke-width="2" opacity="0.3"/>` +
    '<circle cx="86" cy="42" r="2.6" fill="{{sky}}"/>' +
    wheel(26, 55, 7.5) +
    wheel(70, 55, 7.5) +
    '</svg>',

  pickup:
    open +
    '<path d="M42 46V31L50 17C51 15 53 14 56 14H68C71 14 73 15 75 18L82 31C88 32 92 35 92 39V50C92 53 90 54 87 54H42Z" fill="{{primary}}"/>' +
    '<path d="M6 36H42V54H9C7 54 6 53 6 51Z" fill="{{primary}}"/>' +
    '<path d="M10 40H38V50H10Z" fill="{{ink}}" opacity="0.28"/>' +
    '<path d="M54 21H66C68 21 69 22 70 23.5L75 31H54Z" fill="{{surface}}"/>' +
    '<circle cx="88" cy="40" r="2.6" fill="{{sky}}"/>' +
    wheel(24, 54, 8) +
    wheel(74, 54, 8) +
    '</svg>',

  moto:
    open +
    '<circle cx="22" cy="46" r="12" fill="none" stroke="{{ink}}" stroke-width="5"/>' +
    '<circle cx="74" cy="46" r="12" fill="none" stroke="{{ink}}" stroke-width="5"/>' +
    `<path d="M22 46L36 30H54L66 38" ${stroke} stroke="{{ink}}" stroke-width="4"/>` +
    '<path d="M34 28C38 20 52 20 58 28L54 34H38Z" fill="{{primary}}"/>' +
    `<path d="M20 28H36" ${stroke} stroke="{{ink}}" stroke-width="5"/>` +
    `<path d="M64 36L68 20H74" ${stroke} stroke="{{ink}}" stroke-width="4"/>` +
    `<path d="M68 22L74 46" ${stroke} stroke="{{ink}}" stroke-width="4"/>` +
    '<rect x="40" y="36" width="14" height="9" rx="2.5" fill="{{ink}}"/>' +
    '<circle cx="70" cy="26" r="3" fill="{{sky}}"/>' +
    '</svg>',

  taxi:
    open +
    CAR_BODY +
    '<rect x="38" y="5" width="20" height="9" rx="2.5" fill="{{sky}}"/>' +
    '<rect x="45" y="13" width="6" height="4" fill="{{ink}}"/>' +
    checker +
    wheel(28, 53, 8) +
    wheel(68, 53, 8) +
    '</svg>',
};

export function renderGlyph(kind: VehicleIcon, palette: IllustrationPalette): string {
  return renderIllustrationMarkup(GLYPHS[kind], palette, `Veículo "${kind}"`);
}
