import { compareVersions, evaluateUpdate, parseManifest, parseVersion } from '../versionUtils';

describe('parseVersion', () => {
  it('aceita formatos comuns', () => {
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3]);
    expect(parseVersion('v2.0')).toEqual([2, 0]);
    expect(parseVersion('1.0.3-beta.1')).toEqual([1, 0, 3]);
  });
  it('rejeita lixo', () => {
    expect(parseVersion('abc')).toBeNull();
    expect(parseVersion('')).toBeNull();
  });
});

describe('compareVersions', () => {
  it.each([
    ['1.0.2', '1.0.3', -1],
    ['1.0.3', '1.0.2', 1],
    ['1.0.0', '1.0', 0],
    ['1.10.0', '1.9.9', 1], // comparação numérica, não de texto
    ['2.0.0', '1.99.99', 1],
  ])('%s vs %s = %d', (a, b, expected) => {
    expect(compareVersions(a, b)).toBe(expected);
  });

  it('devolve 0 se alguma versão for inválida (não incomoda o usuário)', () => {
    expect(compareVersions('abc', '1.0.0')).toBe(0);
  });
});

describe('parseManifest', () => {
  it('lê um manifesto válido', () => {
    expect(
      parseManifest({ latestVersion: '1.0.3', minSupportedVersion: '1.0.0', message: ' Novo! ' }),
    ).toEqual({ latestVersion: '1.0.3', minSupportedVersion: '1.0.0', message: 'Novo!' });
  });

  it('ignora campos opcionais inválidos', () => {
    expect(parseManifest({ latestVersion: '1.0.3', minSupportedVersion: 'x', message: 5 })).toEqual(
      {
        latestVersion: '1.0.3',
      },
    );
  });

  it('rejeita formatos errados', () => {
    expect(parseManifest(null)).toBeNull();
    expect(parseManifest('1.0.3')).toBeNull();
    expect(parseManifest({})).toBeNull();
    expect(parseManifest({ latestVersion: 'lixo' })).toBeNull();
  });

  it('corta mensagens muito longas', () => {
    const manifest = parseManifest({ latestVersion: '1.0.3', message: 'a'.repeat(500) });
    expect(manifest?.message).toHaveLength(280);
  });
});

describe('evaluateUpdate', () => {
  const manifest = { latestVersion: '1.1.0', minSupportedVersion: '1.0.1' };

  it('up-to-date quando já está na última', () => {
    expect(evaluateUpdate('1.1.0', manifest)).toBe('up-to-date');
    expect(evaluateUpdate('1.2.0', manifest)).toBe('up-to-date');
  });
  it('optional quando há versão mais nova', () => {
    expect(evaluateUpdate('1.0.1', manifest)).toBe('optional');
  });
  it('required quando está abaixo do mínimo suportado', () => {
    expect(evaluateUpdate('1.0.0', manifest)).toBe('required');
  });
  it('sem minSupportedVersion nunca é obrigatório', () => {
    expect(evaluateUpdate('0.1.0', { latestVersion: '1.1.0' })).toBe('optional');
  });
});
