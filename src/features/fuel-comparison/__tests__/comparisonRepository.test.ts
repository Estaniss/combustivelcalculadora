import AsyncStorage from '@react-native-async-storage/async-storage';
import { comparisonRepository, MAX_COMPARISONS } from '../services/comparisonRepository';
import { NewComparisonInput } from '@/domain/comparison';

const sample = (gasolinePrice: number): NewComparisonInput => ({
  gasolinePrice,
  gasolineConsumption: 12,
  ethanolPrice: 4.2,
  ethanolConsumption: 8.5,
  cheaperOption: 'ethanol',
  savingsPer100Km: 2.25,
  priceRatio: 0.68,
});

describe('comparisonRepository', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    // só o relógio é falso (Date); timers e microtasks continuam reais
    jest.useFakeTimers({
      doNotFake: [
        'nextTick',
        'setImmediate',
        'setTimeout',
        'setInterval',
        'clearTimeout',
        'clearInterval',
        'clearImmediate',
        'queueMicrotask',
        'hrtime',
        'performance',
      ],
    });
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('salva e lista da mais recente para a mais antiga', async () => {
    await comparisonRepository.create(sample(6.0));
    jest.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));
    await comparisonRepository.create(sample(6.5));

    const all = await comparisonRepository.getAll();
    expect(all.map((e) => e.gasolinePrice)).toEqual([6.5, 6.0]);
  });

  it(`mantém só as últimas ${MAX_COMPARISONS}`, async () => {
    for (let i = 0; i < MAX_COMPARISONS + 5; i++) {
      jest.setSystemTime(new Date(Date.UTC(2026, 0, 1, 0, 0, i)));
      await comparisonRepository.create(sample(i));
    }
    const all = await comparisonRepository.getAll();
    expect(all).toHaveLength(MAX_COMPARISONS);
    expect(all[0]?.gasolinePrice).toBe(MAX_COMPARISONS + 4); // a mais nova
    expect(all[all.length - 1]?.gasolinePrice).toBe(5); // as 5 mais antigas saíram
  });

  it('remove uma entrada e limpa tudo', async () => {
    const entry = await comparisonRepository.create(sample(6));
    await comparisonRepository.remove(entry.id);
    expect(await comparisonRepository.getAll()).toHaveLength(0);

    await comparisonRepository.create(sample(6));
    await comparisonRepository.clear();
    expect(await comparisonRepository.getAll()).toHaveLength(0);
  });
});
