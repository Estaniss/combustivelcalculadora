import { compareFuelTypes } from '../services/fuelComparison';
import { InvalidInputError } from '@features/trip-calculator/services/tripCalculator';

describe('compareFuelTypes', () => {
  it('identifica gasolina mais barata', () => {
    const result = compareFuelTypes(
      { pricePerLiter: 5.5, consumptionKmPerLiter: 12 },
      { pricePerLiter: 4.5, consumptionKmPerLiter: 8 },
    );
    expect(result.cheaperOption).toBe('gasoline');
  });

  it('identifica etanol mais barato', () => {
    const result = compareFuelTypes(
      { pricePerLiter: 6.2, consumptionKmPerLiter: 12 },
      { pricePerLiter: 4.2, consumptionKmPerLiter: 8.5 },
    );
    expect(result.cheaperOption).toBe('ethanol');
  });

  it('identifica empate', () => {
    const result = compareFuelTypes(
      { pricePerLiter: 6, consumptionKmPerLiter: 12 },
      { pricePerLiter: 4, consumptionKmPerLiter: 8 },
    );
    expect(result.cheaperOption).toBe('tie');
  });

  it('considera consumo diferente, não apenas preço', () => {
    // etanol mais barato por litro, mas consumo tão pior que sai mais caro
    const result = compareFuelTypes(
      { pricePerLiter: 6.2, consumptionKmPerLiter: 12 },
      { pricePerLiter: 5.5, consumptionKmPerLiter: 6 },
    );
    expect(result.cheaperOption).toBe('gasoline');
  });

  it('rejeita entradas inválidas', () => {
    expect(() =>
      compareFuelTypes(
        { pricePerLiter: 0, consumptionKmPerLiter: 12 },
        { pricePerLiter: 4, consumptionKmPerLiter: 8 },
      ),
    ).toThrow(InvalidInputError);
  });
});
