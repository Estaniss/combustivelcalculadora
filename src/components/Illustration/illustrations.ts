/**
 * Ilustrações planas (viewBox 120×120) em SVG. As cores são marcadores
 * {{nome}} trocados pela paleta do tema em renderIllustration — então mudam
 * junto com a cor da marca e com o modo escuro.
 *
 * Marcadores: primary (marca) · soft (fundo suave) · sky (azul claro) ·
 * ink (traços escuros) · surface (papel/branco) · muted (neutro).
 */
export type IllustrationName =
  'pump' | 'drops' | 'gauge' | 'route' | 'trip' | 'station' | 'clipboard' | 'offline';

export interface IllustrationPalette {
  primary: string;
  soft: string;
  sky: string;
  ink: string;
  surface: string;
  muted: string;
}

const open = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">';
const blob = '<circle cx="60" cy="62" r="50" fill="{{soft}}"/>';
const stroke = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';

const SVG: Record<IllustrationName, string> = {
  pump:
    open +
    blob +
    '<rect x="32" y="26" width="42" height="68" rx="7" fill="{{primary}}"/>' +
    '<rect x="39" y="34" width="28" height="18" rx="4" fill="{{surface}}"/>' +
    '<rect x="43" y="40" width="14" height="3" rx="1.5" fill="{{sky}}"/>' +
    '<rect x="43" y="46" width="20" height="3" rx="1.5" fill="{{sky}}"/>' +
    '<path d="M53 62C53 62 45.5 70 45.5 75.2a7.5 7.5 0 0 0 15 0C60.5 70 53 62 53 62Z" fill="{{surface}}"/>' +
    '<rect x="27" y="94" width="52" height="7" rx="3.5" fill="{{ink}}"/>' +
    `<path d="M74 54H82a6 6 0 0 1 6 6V82a4.5 4.5 0 0 0 9 0V50L90 40" ${stroke} stroke="{{ink}}" stroke-width="4.5"/>` +
    '</svg>',

  drops:
    open +
    blob +
    '<path d="M82 40C82 40 64 62 64 76a18 18 0 0 0 36 0C100 62 82 40 82 40Z" fill="{{sky}}"/>' +
    '<path d="M74 77a7 7 0 0 0 7 7" fill="none" stroke="{{surface}}" stroke-width="3.5" stroke-linecap="round" opacity="0.85"/>' +
    '<path d="M44 26C44 26 22 52 22 70a22 22 0 0 0 44 0C66 52 44 26 44 26Z" fill="{{primary}}"/>' +
    '<path d="M35 71a9 9 0 0 0 9 9" fill="none" stroke="{{surface}}" stroke-width="3.5" stroke-linecap="round" opacity="0.85"/>' +
    '</svg>',

  gauge:
    open +
    blob +
    `<path d="M24 80A36 36 0 0 1 96 80" ${stroke} stroke="{{surface}}" stroke-width="12"/>` +
    `<path d="M24 80A36 36 0 0 1 76.3 47.9" ${stroke} stroke="{{primary}}" stroke-width="12"/>` +
    `<path d="M60 80L72.7 55" ${stroke} stroke="{{ink}}" stroke-width="4.5"/>` +
    '<circle cx="60" cy="80" r="7" fill="{{ink}}"/><circle cx="60" cy="80" r="2.6" fill="{{surface}}"/>' +
    '<rect x="42" y="94" width="36" height="6" rx="3" fill="{{sky}}"/>' +
    '</svg>',

  route:
    open +
    blob +
    `<path d="M30 94C30 72 78 78 78 54C78 40 56 40 56 30" ${stroke} stroke="{{ink}}" stroke-width="4" stroke-dasharray="0.1 9"/>` +
    '<circle cx="30" cy="94" r="8" fill="{{primary}}"/><circle cx="30" cy="94" r="3.2" fill="{{surface}}"/>' +
    '<path d="M56 42C56 42 44 30 44 23a12 12 0 0 1 24 0C68 30 56 42 56 42Z" fill="{{primary}}"/>' +
    '<circle cx="56" cy="23" r="4.5" fill="{{surface}}"/>' +
    '<circle cx="92" cy="88" r="18" fill="{{sky}}"/><circle cx="92" cy="88" r="18" fill="none" stroke="{{primary}}" stroke-width="3"/>' +
    '<path d="M92 77C92 77 84.5 85 84.5 90a7.5 7.5 0 0 0 15 0C99.5 85 92 77 92 77Z" fill="{{primary}}"/>' +
    '</svg>',

  trip:
    open +
    blob +
    '<rect x="12" y="88" width="96" height="11" rx="5.5" fill="{{ink}}" opacity="0.88"/>' +
    '<path d="M22 93.5H98" fill="none" stroke="{{surface}}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="8 8"/>' +
    '<path d="M24 80C24 72 30 68 38 66L48 52C50 49 53 48 56 48H76C80 48 83 50 85 53L92 66C98 67 100 71 100 76V82C100 85 98 87 95 87H29C26 87 24 85 24 82Z" fill="{{primary}}"/>' +
    '<path d="M50 55L44 66H64V55Z" fill="{{surface}}"/>' +
    '<path d="M69 55H77C79 55 80 56 81 57.5L86 66H69Z" fill="{{surface}}"/>' +
    '<circle cx="96" cy="76" r="3" fill="{{sky}}"/>' +
    '<circle cx="42" cy="87" r="9" fill="{{ink}}"/><circle cx="42" cy="87" r="3.8" fill="{{surface}}"/>' +
    '<circle cx="84" cy="87" r="9" fill="{{ink}}"/><circle cx="84" cy="87" r="3.8" fill="{{surface}}"/>' +
    `<path d="M10 62H22M6 72H18M13 52H21" ${stroke} stroke="{{sky}}" stroke-width="3.5"/>` +
    '<path d="M94 40C94 40 86 31 86 26a8 8 0 0 1 16 0C102 31 94 40 94 40Z" fill="{{primary}}"/>' +
    '<circle cx="94" cy="26" r="3" fill="{{surface}}"/>' +
    '</svg>',

  station:
    open +
    blob +
    '<ellipse cx="60" cy="100" rx="22" ry="5" fill="{{ink}}" opacity="0.12"/>' +
    '<path d="M60 98C60 98 30 70 30 46a30 30 0 0 1 60 0C90 70 60 98 60 98Z" fill="{{primary}}"/>' +
    '<circle cx="60" cy="46" r="19" fill="{{surface}}"/>' +
    '<rect x="52" y="35" width="13" height="21" rx="2.5" fill="{{primary}}"/>' +
    '<rect x="54.5" y="38" width="8" height="5.5" rx="1.2" fill="{{sky}}"/>' +
    `<path d="M65 41h3.2a2 2 0 0 1 2 2v9.5a1.9 1.9 0 0 0 3.8 0V40" ${stroke} stroke="{{primary}}" stroke-width="2"/>` +
    '</svg>',

  clipboard:
    open +
    blob +
    '<rect x="32" y="30" width="56" height="68" rx="9" fill="{{surface}}"/>' +
    '<rect x="46" y="22" width="28" height="14" rx="5" fill="{{primary}}"/>' +
    '<rect x="42" y="48" width="36" height="5" rx="2.5" fill="{{sky}}"/>' +
    '<rect x="42" y="60" width="26" height="5" rx="2.5" fill="{{sky}}"/>' +
    '<rect x="42" y="72" width="31" height="5" rx="2.5" fill="{{sky}}"/>' +
    '<path d="M74 80C74 80 69 85.5 69 89a5 5 0 0 0 10 0C79 85.5 74 80 74 80Z" fill="{{primary}}"/>' +
    '</svg>',

  offline:
    open +
    blob +
    `<path d="M26 52C46 34 74 34 94 52" ${stroke} stroke="{{primary}}" stroke-width="6.5"/>` +
    `<path d="M39 65C52 54 68 54 81 65" ${stroke} stroke="{{primary}}" stroke-width="6.5"/>` +
    '<circle cx="60" cy="79" r="5.5" fill="{{primary}}"/>' +
    `<path d="M36 98L88 32" ${stroke} stroke="{{surface}}" stroke-width="11"/>` +
    `<path d="M36 98L88 32" ${stroke} stroke="{{ink}}" stroke-width="5"/>` +
    '</svg>',
};

export const ILLUSTRATION_NAMES = Object.keys(SVG) as IllustrationName[];

/** Troca os marcadores {{cor}} pela paleta. Falha alto se faltar alguma cor. */
export function renderIllustration(name: IllustrationName, palette: IllustrationPalette): string {
  return SVG[name].replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const color = (palette as unknown as Record<string, string | undefined>)[key];
    if (!color) throw new Error(`Ilustração "${name}": cor "${key}" não definida na paleta`);
    return color;
  });
}
