/**
 * Interpreta o subconjunto mais comum da tag `opening_hours` do OpenStreetMap
 * para responder "está aberto agora?". Tudo que não for reconhecido devolve
 * `undefined` ("não sei") — nunca chutamos "fechado".
 *
 * Suportado:  "24/7" · "Mo-Fr 07:00-19:00; Sa 08:00-12:00" · "Mo,We,Fr 08:00-18:00"
 *             "08:00-12:00,14:00-18:00" · "Su off" · faixas que viram a noite ("22:00-02:00")
 * Não suportado (→ undefined): feriados (PH/SH), semanas, nascer/pôr do sol, comentários.
 *
 * Usa o horário do aparelho (aproximação: o usuário está perto do posto).
 */

type Range = { start: number; end: number }; // minutos desde 00:00; end pode passar de 1440 (vira a noite)

const DAY_INDEX: Record<string, number> = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const MINUTES_PER_DAY = 1440;

function parseTime(text: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (minutes > 59 || hours > 24 || (hours === 24 && minutes !== 0)) return null;
  return hours * 60 + minutes;
}

function parseDays(spec: string): number[] | null {
  const days = new Set<number>();
  for (const part of spec.split(',')) {
    const bounds = part.split('-');
    if (bounds.length > 2) return null;
    const from = DAY_INDEX[bounds[0] ?? ''];
    const to = bounds.length === 2 ? DAY_INDEX[bounds[1] ?? ''] : from;
    if (from === undefined || to === undefined) return null;
    // intervalo pode "dar a volta" na semana (ex: Sa-Mo)
    for (let day = from; ; day = (day + 1) % 7) {
      days.add(day);
      if (day === to) break;
    }
  }
  return [...days];
}

function parseRanges(spec: string): Range[] | null {
  const ranges: Range[] = [];
  for (const part of spec.split(',')) {
    const match = /^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/.exec(part.trim());
    if (!match) return null;
    const start = parseTime(match[1] ?? '');
    let end = parseTime(match[2] ?? '');
    if (start === null || end === null) return null;
    if (end <= start) end += MINUTES_PER_DAY; // 22:00-02:00 vira a noite
    ranges.push({ start, end });
  }
  return ranges;
}

/** Monta a agenda por dia da semana, ou null se algum trecho não for reconhecido. */
function parseSchedule(openingHours: string): Map<number, Range[]> | 'always' | null {
  const text = openingHours.trim();
  if (text === '24/7') return 'always';
  if (text === '') return null;

  const schedule = new Map<number, Range[]>();
  for (const rawRule of text.split(';')) {
    const rule = rawRule.trim();
    if (rule === '') continue;

    const match = /^(?:([A-Za-z,\-]+)\s+)?(.+)$/.exec(rule);
    if (!match) return null;

    const days = match[1] ? parseDays(match[1]) : [0, 1, 2, 3, 4, 5, 6];
    if (!days) return null;

    const timesSpec = (match[2] ?? '').trim();
    const ranges = /^(off|closed)$/i.test(timesSpec) ? [] : parseRanges(timesSpec);
    if (!ranges) return null;

    // regras seguintes sobrescrevem as anteriores nos mesmos dias
    for (const day of days) schedule.set(day, ranges);
  }
  return schedule.size > 0 ? schedule : null;
}

export function isOpenNow(openingHours: string | undefined, now: Date): boolean | undefined {
  if (!openingHours) return undefined;
  const schedule = parseSchedule(openingHours);
  if (schedule === null) return undefined;
  if (schedule === 'always') return true;

  const today = now.getDay();
  const yesterday = (today + 6) % 7;
  const minute = now.getHours() * 60 + now.getMinutes();

  // faixa de hoje (end exclusivo)
  const openToday = (schedule.get(today) ?? []).some(
    (range) => minute >= range.start && minute < Math.min(range.end, MINUTES_PER_DAY),
  );
  if (openToday) return true;

  // sobra de uma faixa de ontem que virou a noite
  return (schedule.get(yesterday) ?? []).some(
    (range) => range.end > MINUTES_PER_DAY && minute < range.end - MINUTES_PER_DAY,
  );
}
