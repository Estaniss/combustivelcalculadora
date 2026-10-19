import { isOpenNow } from '../services/openingHours';

// 19/10/2026 é uma segunda-feira. dia 0 = segunda ... 6 = domingo (fuso local do teste).
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, 19 + day, hour, minute);
const [MON, TUE, WED, THU, FRI, SAT, SUN] = [0, 1, 2, 3, 4, 5, 6];

describe('isOpenNow', () => {
  it('a data de referência é mesmo uma segunda', () => {
    expect(at(MON, 12).getDay()).toBe(1);
  });

  it('devolve undefined (não sei) para vazio ou ausente', () => {
    expect(isOpenNow(undefined, at(MON, 10))).toBeUndefined();
    expect(isOpenNow('', at(MON, 10))).toBeUndefined();
  });

  it('24/7 está sempre aberto', () => {
    expect(isOpenNow('24/7', at(SUN, 3))).toBe(true);
  });

  it('respeita dias e horários, com fim exclusivo', () => {
    const rule = 'Mo-Fr 07:00-19:00; Sa 08:00-12:00';
    expect(isOpenNow(rule, at(MON, 10))).toBe(true);
    expect(isOpenNow(rule, at(MON, 7, 0))).toBe(true);
    expect(isOpenNow(rule, at(MON, 6, 59))).toBe(false);
    expect(isOpenNow(rule, at(MON, 19, 0))).toBe(false);
    expect(isOpenNow(rule, at(SAT, 11, 59))).toBe(true);
    expect(isOpenNow(rule, at(SAT, 12, 0))).toBe(false);
  });

  it('dia não mencionado nas regras conta como fechado', () => {
    expect(isOpenNow('Mo-Fr 07:00-19:00; Sa 08:00-12:00', at(SUN, 10))).toBe(false);
  });

  it('regra seguinte sobrescreve a anterior nos mesmos dias', () => {
    const rule = 'Mo-Su 06:00-22:00; Su off';
    expect(isOpenNow(rule, at(SUN, 10))).toBe(false);
    expect(isOpenNow(rule, at(MON, 10))).toBe(true);
  });

  it('aceita várias faixas no mesmo dia', () => {
    const rule = 'Mo-Fr 08:00-12:00,14:00-18:00';
    expect(isOpenNow(rule, at(WED, 13))).toBe(false);
    expect(isOpenNow(rule, at(WED, 15))).toBe(true);
  });

  it('aceita lista de dias e regra sem dias (vale para todos)', () => {
    expect(isOpenNow('Mo,We,Fr 08:00-18:00', at(TUE, 10))).toBe(false);
    expect(isOpenNow('Mo,We,Fr 08:00-18:00', at(WED, 10))).toBe(true);
    expect(isOpenNow('08:00-18:00', at(SUN, 10))).toBe(true);
  });

  it('intervalo de dias que dá a volta na semana (Sa-Mo)', () => {
    expect(isOpenNow('Sa-Mo 08:00-12:00', at(SUN, 9))).toBe(true);
    expect(isOpenNow('Sa-Mo 08:00-12:00', at(TUE, 9))).toBe(false);
  });

  it('faixa que vira a noite continua aberta na madrugada seguinte', () => {
    const rule = 'Mo-Su 22:00-02:00';
    expect(isOpenNow(rule, at(MON, 23))).toBe(true);
    expect(isOpenNow(rule, at(TUE, 1))).toBe(true);
    expect(isOpenNow(rule, at(TUE, 3))).toBe(false);
    expect(isOpenNow(rule, at(MON, 1))).toBe(true); // vem de domingo
  });

  it('madrugada só vale se o dia anterior estava aberto', () => {
    const rule = 'Fr 22:00-02:00';
    expect(isOpenNow(rule, at(FRI, 23))).toBe(true);
    expect(isOpenNow(rule, at(SAT, 1))).toBe(true);
    expect(isOpenNow(rule, at(SUN, 1))).toBe(false);
  });

  it('00:00-24:00 cobre o dia inteiro', () => {
    expect(isOpenNow('Mo-Su 00:00-24:00', at(THU, 23, 59))).toBe(true);
  });

  it.each([
    'Mo-Fr 08:00-18:00; PH off',
    'sunrise-sunset',
    'Mo-Fr 08:00-18:00 "ligar antes"',
    'foo',
    'Mo-Xx 08:00-18:00',
    'Mo-Fr 25:00-26:00',
    'Mo-Fr 08:00',
  ])('formato não suportado "%s" devolve undefined em vez de chutar', (rule) => {
    expect(isOpenNow(rule, at(MON, 10))).toBeUndefined();
  });
});
