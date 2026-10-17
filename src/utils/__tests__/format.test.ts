import { formatPercent, parseLocaleNumber } from '../format';

describe('parseLocaleNumber', () => {
  it.each([
    ['37,5', 37.5],
    ['6,20', 6.2],
    ['1.250,50', 1250.5],
    ['37.5', 37.5], // bug antigo: virava 375
    ['6.20', 6.2],
    ['1.250', 1250], // 3 casas depois do ponto = milhar (pt-BR)
    ['1.250.000', 1250000],
    ['0.125', 0.125],
    ['50450', 50450],
    ['  12 ', 12],
    ['R$ 6,20', 6.2],
  ])('converte "%s" para %d', (input, expected) => {
    expect(parseLocaleNumber(input)).toBeCloseTo(expected, 6);
  });

  it.each(['', '   ', 'abc', '12a', '1,5,3', '.', ','])('devolve NaN para "%s"', (input) => {
    expect(parseLocaleNumber(input)).toBeNaN();
  });

  it('mantém o sinal negativo para a validação rejeitar depois', () => {
    expect(parseLocaleNumber('-5')).toBe(-5);
  });
});

describe('formatPercent', () => {
  it('formata razão como porcentagem pt-BR', () => {
    expect(formatPercent(0.6774)).toBe('67,7%');
    expect(formatPercent(0.7, 0)).toBe('70%');
  });
});
