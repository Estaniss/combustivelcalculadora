import { checkForUpdate } from '../updateService';

type Init = { signal?: AbortSignal };
const okFetch = (body: unknown) => async () => ({ ok: true, json: async () => body });

describe('checkForUpdate', () => {
  it('detecta atualização opcional', async () => {
    const result = await checkForUpdate('1.0.2', {
      fetchImpl: okFetch({ latestVersion: '1.0.3', message: 'Novidades' }),
    });
    expect(result).toEqual({ status: 'optional', latestVersion: '1.0.3', message: 'Novidades' });
  });

  it('detecta atualização obrigatória', async () => {
    const result = await checkForUpdate('1.0.0', {
      fetchImpl: okFetch({ latestVersion: '1.2.0', minSupportedVersion: '1.1.0' }),
    });
    expect(result.status).toBe('required');
  });

  it('está em dia', async () => {
    const result = await checkForUpdate('1.0.3', {
      fetchImpl: okFetch({ latestVersion: '1.0.3' }),
    });
    expect(result.status).toBe('up-to-date');
  });

  it('não quebra offline', async () => {
    const result = await checkForUpdate('1.0.2', {
      fetchImpl: async () => {
        throw new Error('Network request failed');
      },
    });
    expect(result).toEqual({ status: 'unavailable' });
  });

  it('trata resposta HTTP com erro e JSON inválido como indisponível', async () => {
    expect(
      (
        await checkForUpdate('1.0.2', {
          fetchImpl: async () => ({ ok: false, json: async () => ({}) }),
        })
      ).status,
    ).toBe('unavailable');
    expect((await checkForUpdate('1.0.2', { fetchImpl: okFetch({ foo: 1 }) })).status).toBe(
      'unavailable',
    );
  });

  it('desiste depois do tempo limite', async () => {
    const neverResolves = (_url: string, init?: Init) =>
      new Promise<never>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });
    const result = await checkForUpdate('1.0.2', { fetchImpl: neverResolves, timeoutMs: 20 });
    expect(result).toEqual({ status: 'unavailable' });
  });
});
