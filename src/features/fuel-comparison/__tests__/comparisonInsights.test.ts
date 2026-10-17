import { compareFuelTypes } from '../services/fuelComparison';
import { buildComparisonExplanation, estimateTankSavings } from '../services/comparisonInsights';

const ethanolWins = () =>
  compareFuelTypes(
    { pricePerLiter: 6.2, consumptionKmPerLiter: 12 },
    { pricePerLiter: 4.2, consumptionKmPerLiter: 8.5 },
  );

describe('razões da comparação', () => {
  it('calcula a razão de preço e o ponto de equilíbrio do carro', () => {
    const result = ethanolWins();
    expect(result.priceRatio).toBeCloseTo(4.2 / 6.2, 6);
    expect(result.breakEvenRatio).toBeCloseTo(8.5 / 12, 6);
    // etanol vence exatamente quando a razão de preço fica abaixo do equilíbrio
    expect(result.priceRatio < result.breakEvenRatio).toBe(result.cheaperOption === 'ethanol');
  });
});

describe('estimateTankSavings', () => {
  it('calcula a economia de um tanque cheio do combustível vencedor', () => {
    const comparison = ethanolWins();
    const tank = estimateTankSavings({
      comparison,
      tankLiters: 50,
      gasolineConsumption: 12,
      ethanolConsumption: 8.5,
    });
    expect(tank?.fuel).toBe('ethanol');
    expect(tank?.distanceKm).toBeCloseTo(425, 6);
    expect(tank?.savings).toBeCloseTo(425 * (6.2 / 12 - 4.2 / 8.5), 6);
  });

  it('retorna null em empate ou tanque inválido', () => {
    const tie = compareFuelTypes(
      { pricePerLiter: 6, consumptionKmPerLiter: 12 },
      { pricePerLiter: 4, consumptionKmPerLiter: 8 },
    );
    const base = { tankLiters: 50, gasolineConsumption: 12, ethanolConsumption: 8 };
    expect(estimateTankSavings({ comparison: tie, ...base })).toBeNull();
    expect(estimateTankSavings({ comparison: ethanolWins(), ...base, tankLiters: 0 })).toBeNull();
    expect(estimateTankSavings({ comparison: ethanolWins(), ...base, tankLiters: NaN })).toBeNull();
  });
});

describe('buildComparisonExplanation', () => {
  it('explica por que o etanol compensa e mostra a economia por tanque', () => {
    const comparison = ethanolWins();
    const tank = estimateTankSavings({
      comparison,
      tankLiters: 50,
      gasolineConsumption: 12,
      ethanolConsumption: 8.5,
    });
    const text = buildComparisonExplanation(comparison, tank);

    expect(text.headline).toBe('Etanol compensa mais');
    expect(text.reasons.join(' ')).toContain('67,7%');
    expect(text.reasons.join(' ')).toContain('70,8%');
    expect(text.reasons.join(' ')).toContain('está abaixo de');
    expect(text.savings[0]).toMatch(/2,25/);
    expect(text.savings[1]).toContain('Abastecendo com Etanol você economiza aprox.');
    expect(text.savings[1]).toMatch(/9,58/);
  });

  it('explica quando a gasolina compensa', () => {
    const comparison = compareFuelTypes(
      { pricePerLiter: 6.2, consumptionKmPerLiter: 12 },
      { pricePerLiter: 5.5, consumptionKmPerLiter: 6 },
    );
    const text = buildComparisonExplanation(comparison);
    expect(text.headline).toBe('Gasolina compensa mais');
    expect(text.reasons.join(' ')).toContain('está acima de');
    expect(text.savings).toHaveLength(1); // sem tanque, sem linha de tanque
  });

  it('trata empate sem prometer economia', () => {
    const comparison = compareFuelTypes(
      { pricePerLiter: 6, consumptionKmPerLiter: 12 },
      { pricePerLiter: 4, consumptionKmPerLiter: 8 },
    );
    const text = buildComparisonExplanation(comparison);
    expect(text.headline).toContain('Empate');
    expect(text.savings).toEqual([]);
  });
});
