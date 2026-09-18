import { InvalidInputError } from '@features/trip-calculator/services/tripCalculator';

export interface FuelOption {
  pricePerLiter: number;
  consumptionKmPerLiter: number;
}

export interface FuelComparisonResult {
  gasolineCostPerKm: number;
  ethanolCostPerKm: number;
  gasolineCostPer100Km: number;
  ethanolCostPer100Km: number;
  cheaperOption: 'gasoline' | 'ethanol' | 'tie';
  /** Diferença percentual da opção mais cara em relação à mais barata */
  percentageDifference: number;
  /** Economia estimada a cada 100 km, sempre >= 0 */
  savingsPer100Km: number;
}

function assertValidOption(option: FuelOption, label: string): void {
  if (
    Number.isNaN(option.pricePerLiter) ||
    !Number.isFinite(option.pricePerLiter) ||
    option.pricePerLiter <= 0
  ) {
    throw new InvalidInputError(`Informe um preço válido para ${label}.`);
  }
  if (
    Number.isNaN(option.consumptionKmPerLiter) ||
    !Number.isFinite(option.consumptionKmPerLiter) ||
    option.consumptionKmPerLiter <= 0
  ) {
    throw new InvalidInputError(`Informe um consumo válido para ${label}.`);
  }
}

/**
 * Compara gasolina x etanol considerando preço + consumo real informado
 * pelo usuário — NÃO usa a regra genérica dos "70%".
 */
export function compareFuelTypes(gasoline: FuelOption, ethanol: FuelOption): FuelComparisonResult {
  assertValidOption(gasoline, 'a gasolina');
  assertValidOption(ethanol, 'o etanol');

  const gasolineCostPerKm = gasoline.pricePerLiter / gasoline.consumptionKmPerLiter;
  const ethanolCostPerKm = ethanol.pricePerLiter / ethanol.consumptionKmPerLiter;

  const gasolineCostPer100Km = gasolineCostPerKm * 100;
  const ethanolCostPer100Km = ethanolCostPerKm * 100;

  let cheaperOption: FuelComparisonResult['cheaperOption'] = 'tie';
  if (gasolineCostPerKm < ethanolCostPerKm) cheaperOption = 'gasoline';
  else if (ethanolCostPerKm < gasolineCostPerKm) cheaperOption = 'ethanol';

  const higher = Math.max(gasolineCostPerKm, ethanolCostPerKm);
  const lower = Math.min(gasolineCostPerKm, ethanolCostPerKm);
  const percentageDifference = lower === 0 ? 0 : ((higher - lower) / lower) * 100;
  const savingsPer100Km = Math.abs(gasolineCostPer100Km - ethanolCostPer100Km);

  return {
    gasolineCostPerKm,
    ethanolCostPerKm,
    gasolineCostPer100Km,
    ethanolCostPer100Km,
    cheaperOption,
    percentageDifference,
    savingsPer100Km,
  };
}
