import { INPUT_LIMITS, validateNumber } from '../validation';

describe('validateNumber', () => {
  it('aceita número válido com vírgula ou ponto', () => {
    expect(validateNumber('37,5', 'os litros')).toEqual({ ok: true, value: 37.5 });
    expect(validateNumber('37.5', 'os litros')).toEqual({ ok: true, value: 37.5 });
  });

  it('pede para informar quando vazio', () => {
    expect(validateNumber('', 'a distância')).toEqual({ ok: false, error: 'Informe a distância.' });
    expect(validateNumber('   ', 'a distância')).toEqual({
      ok: false,
      error: 'Informe a distância.',
    });
  });

  it('rejeita letras', () => {
    const result = validateNumber('abc', 'o consumo');
    expect(result).toEqual({ ok: false, error: 'O consumo deve conter apenas números.' });
  });

  it('rejeita negativo e zero', () => {
    expect(validateNumber('-3', 'o consumo')).toEqual({
      ok: false,
      error: 'O consumo não pode ser negativo.',
    });
    expect(validateNumber('0', 'o consumo')).toEqual({
      ok: false,
      error: 'O consumo deve ser maior que zero.',
    });
  });

  it('aceita zero quando permitido', () => {
    expect(validateNumber('0', 'o valor', { allowZero: true })).toEqual({ ok: true, value: 0 });
  });

  it('rejeita acima do máximo', () => {
    const result = validateNumber('500', 'o consumo', { max: INPUT_LIMITS.consumptionKmPerLiter });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('alto demais');
  });

  it('exige inteiro quando pedido', () => {
    expect(validateNumber('2,5', 'a quantidade', { integer: true }).ok).toBe(false);
    expect(validateNumber('3', 'a quantidade', { integer: true })).toEqual({ ok: true, value: 3 });
  });
});
