import { formatCurrency, formatKm, formatNumber, formatPercent } from '@utils/format';
import { FuelComparisonResult } from './fuelComparison';

export interface TankSavingsInput {
  comparison: FuelComparisonResult;
  tankLiters: number;
  gasolineConsumption: number;
  ethanolConsumption: number;
}

export interface TankSavings {
  fuel: 'gasoline' | 'ethanol';
  /** Distância que um tanque cheio do combustível vencedor rende. */
  distanceKm: number;
  /** Quanto se economiza ao rodar essa distância com o vencedor. */
  savings: number;
}

/**
 * Economia ao abastecer um tanque cheio do combustível mais vantajoso:
 * distância = capacidade × consumo do vencedor;
 * economia  = distância × (custo/km do perdedor − custo/km do vencedor).
 * Retorna null em empate ou quando a capacidade do tanque é inválida.
 */
export function estimateTankSavings({
  comparison,
  tankLiters,
  gasolineConsumption,
  ethanolConsumption,
}: TankSavingsInput): TankSavings | null {
  if (comparison.cheaperOption === 'tie') return null;
  if (!Number.isFinite(tankLiters) || tankLiters <= 0) return null;

  const fuel = comparison.cheaperOption;
  const winnerConsumption = fuel === 'gasoline' ? gasolineConsumption : ethanolConsumption;
  const winnerCostPerKm =
    fuel === 'gasoline' ? comparison.gasolineCostPerKm : comparison.ethanolCostPerKm;
  const loserCostPerKm =
    fuel === 'gasoline' ? comparison.ethanolCostPerKm : comparison.gasolineCostPerKm;

  const distanceKm = tankLiters * winnerConsumption;
  return { fuel, distanceKm, savings: distanceKm * (loserCostPerKm - winnerCostPerKm) };
}

export interface ComparisonExplanation {
  headline: string;
  /** Frases que explicam o porquê da escolha, em linguagem simples. */
  reasons: string[];
  /** Frases com a economia estimada (por 100 km e, se houver, por tanque). */
  savings: string[];
}

const FUEL_LABEL = { gasoline: 'Gasolina', ethanol: 'Etanol' } as const;

export function buildComparisonExplanation(
  comparison: FuelComparisonResult,
  tankSavings: TankSavings | null = null,
): ComparisonExplanation {
  const priceText = formatPercent(comparison.priceRatio);
  const breakEvenText = formatPercent(comparison.breakEvenRatio);

  const reasons = [
    `O etanol custa ${priceText} do preço da gasolina.`,
    `Com o consumo do seu carro, o etanol só compensa se custar até ${breakEvenText} da gasolina.`,
  ];

  if (comparison.cheaperOption === 'tie') {
    return {
      headline: 'Empate: os dois custam o mesmo por km',
      reasons,
      savings: [],
    };
  }

  const winner = comparison.cheaperOption;
  reasons.push(
    winner === 'ethanol'
      ? `Como ${priceText} está abaixo de ${breakEvenText}, o etanol compensa.`
      : `Como ${priceText} está acima de ${breakEvenText}, a gasolina compensa.`,
  );

  const winnerCostPerKm =
    winner === 'gasoline' ? comparison.gasolineCostPerKm : comparison.ethanolCostPerKm;
  const loserCostPerKm =
    winner === 'gasoline' ? comparison.ethanolCostPerKm : comparison.gasolineCostPerKm;
  const cheaperByPercent = ((loserCostPerKm - winnerCostPerKm) / loserCostPerKm) * 100;

  const savings = [
    `Economia de aproximadamente ${formatCurrency(comparison.savingsPer100Km)} a cada 100 km (${formatNumber(cheaperByPercent, 1)}% mais barato por km).`,
  ];
  if (tankSavings) {
    savings.push(
      `Abastecendo com ${FUEL_LABEL[tankSavings.fuel]} você economiza aprox. ${formatCurrency(tankSavings.savings)} neste tanque (≈ ${formatKm(Math.round(tankSavings.distanceKm))}).`,
    );
  }

  return {
    headline: `${FUEL_LABEL[winner]} compensa mais`,
    reasons,
    savings,
  };
}
