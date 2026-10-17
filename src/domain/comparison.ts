export interface ComparisonEntry {
  id: string;
  gasolinePrice: number;
  gasolineConsumption: number;
  ethanolPrice: number;
  ethanolConsumption: number;
  cheaperOption: 'gasoline' | 'ethanol' | 'tie';
  savingsPer100Km: number;
  /** Preço do etanol dividido pelo da gasolina (0.68 = 68%). */
  priceRatio: number;
  createdAt: string;
}

export type NewComparisonInput = Omit<ComparisonEntry, 'id' | 'createdAt'>;
