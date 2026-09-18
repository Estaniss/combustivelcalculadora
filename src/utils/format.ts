/**
 * Utilitários de formatação pt-BR — genéricos, reutilizáveis por qualquer
 * app da fábrica (não específicos deste app).
 */

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return currencyFormatter.format(0);
  return currencyFormatter.format(value);
}

export function formatNumber(value: number, maximumFractionDigits = 2): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits }).format(value);
}

export function formatKm(value: number): string {
  return `${formatNumber(value)} km`;
}

export function formatKmPerLiter(value: number): string {
  return `${formatNumber(value)} km/L`;
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

/** Converte string digitada (com vírgula ou ponto) para número. */
export function parseLocaleNumber(value: string): number {
  return Number(value.replace(/\./g, '').replace(',', '.'));
}
